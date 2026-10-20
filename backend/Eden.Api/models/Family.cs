using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Eden.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Eden.Api.Models
{
    public class Family
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public uint Members { get; set; }
        public uint Children { get; set; }
        public int Isee { get; set; }
        public bool IsOccasional { get; set; }
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public AssistanceLevel NecessityLevel { get; set; } = AssistanceLevel.VeryLow;

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public DateTime CreatedAt { get; set; }

        public static Task<List<Family>> GetFamiliesAsync()
        {
            return EdenAppContext.Context.WithDbContext(db => db.Families.OrderBy(f => f.CreatedAt).ToListAsync());
        }

        public static Task<Family?> GetFamilyByIdAsync(int id)
        {
            return EdenAppContext.Context.WithDbContext(db => db.Families.Where(f => f.Id == id).FirstOrDefaultAsync());
        }

        public static Task<List<Family>> GetFamiliesByIdsAsync(List<int> ids)
        {
            return EdenAppContext.Context.WithDbContext(db => db.Families.Where(f => ids.Contains(f.Id!.Value)).ToListAsync());
        }

        public static async Task<Family?> AddFamily(Family family)
        {

            Family? newFamily = null;

            await EdenAppContext.Context.WithDbContext(db =>
            {
                family.NecessityLevel = CalculateNeedLevel(family.Isee, family.Children, family.Members);
                newFamily = db.Families.Add(family).Entity;
                return db.SaveChangesAsync();
            });

            return newFamily;
        }

        public Task UpdateFamilyAsync()
        {
            var newLevel = CalculateNeedLevel(Isee, Children, Members);
            NecessityLevel = newLevel;
            return EdenAppContext.Context.WithDbContext(db =>
            {
                db.Update(this);
                return db.SaveChangesAsync();
            });
        }

        public static async Task<bool> DeleteFamilyAsync(int id)
        {
            var family = await GetFamilyByIdAsync(id);
            if (family == null)
            {
                return false;
            }

            await EdenAppContext.Context.WithDbContext(db =>
            {
                db.Families.Remove(family);
                return db.SaveChangesAsync();
            });

            return true;
        }

        /// <summary>
        /// Calculates the necessity level of a family for fair food distribution.
        /// 
        /// The algorithm combines 4 main factors:
        /// 1. ISEE: Family's economic situation (lower = higher need)
        /// 2. Absolute number of children: More children = higher expenses for food, school, etc.
        /// 3. Percentage of children: High percentage = more economically dependent members
        /// 4. Family size: More members = more mouths to feed
        /// 
        /// Each factor is normalized to a 0-1 scale and combined with specific weights to 
        /// obtain a final score that determines the assistance level.
        /// </summary>
        /// <param name="isee">Family's ISEE (maximum threshold for admission: €10,040)</param>
        /// <param name="children">Number of children (minors) in the family</param>
        /// <param name="totalMembers">Total number of family members</param>
        /// <returns>The calculated assistance level (from VeryHigh to VeryLow)</returns>
        public static AssistanceLevel CalculateNeedLevel(int isee, uint children, uint totalMembers)
        {
            // VALIDATION: If there are no members, the family is considered in a stable situation
            // (edge case that should not occur in practice)
            if (totalMembers == 0)
                return AssistanceLevel.VeryLow;

            // NORMALIZATION CONSTANTS
            // These values represent the expected maximums for each parameter
            // and are used to normalize values to a 0-1 scale
            const decimal MAX_ISEE = 10040m;      // Maximum ISEE for service admission
            const decimal MAX_CHILDREN = 6m;      // Expected maximum number of children (for normalization)
            const decimal MAX_MEMBERS = 10m;      // Expected maximum household size

            // =====================================================================
            // FACTOR 1: ISEE SCORE (how low is the family's ISEE)
            // =====================================================================
            // ISEE indicates the equivalent economic situation of the family.
            // A lower ISEE indicates greater economic difficulty.
            //
            // Calculation examples:
            // - ISEE €0       → iseeNormalized = 0.00 → iseeScore = 1.00 (maximum need)
            // - ISEE €5,020   → iseeNormalized = 0.50 → iseeScore = 0.50 (medium need)
            // - ISEE €10,040  → iseeNormalized = 1.00 → iseeScore = 0.00 (minimum need)
            decimal iseeNormalized = (decimal)isee / MAX_ISEE;
            decimal iseeScore = 1m - iseeNormalized;

            // =====================================================================
            // FACTOR 2: CHILD RATIO (percentage of children)
            // =====================================================================
            // Indicates the proportion of children relative to total members.
            // A high percentage means more dependent members and fewer working adults.
            //
            // Calculation examples:
            // - 2 children out of 4 members → childRatio = 0.50 (50% children)
            // - 4 children out of 6 members → childRatio = 0.67 (67% children)
            // - 0 children out of 4 members → childRatio = 0.00 (0% children)
            decimal childRatio = (decimal)children / totalMembers;

            // =====================================================================
            // FACTOR 3: ABSOLUTE NUMBER OF CHILDREN (normalized)
            // =====================================================================
            // This factor considers the actual number of children, not just the percentage.
            // It's important because having 4 children costs more than having 2, regardless
            // of the number of adults present. More children = higher expenses for food, school,
            // clothing, medical care, etc.
            //
            // Calculation examples:
            // - 2 children → childrenNormalized = 2/6 = 0.333
            // - 4 children → childrenNormalized = 4/6 = 0.667
            // - 6 children → childrenNormalized = 6/6 = 1.000 (capped at maximum)
            // - 8 children → childrenNormalized = 8/6 = 1.333 → capped at 1.000
            decimal childrenNormalized = Math.Min((decimal)children / MAX_CHILDREN, 1m);

            // =====================================================================
            // FACTOR 4: HOUSEHOLD SIZE (normalized)
            // =====================================================================
            // Larger families have greater absolute needs: more people means more food needed,
            // higher overall expenses, even if ISEE is relatively high.
            //
            // Calculation examples:
            // - 4 members  → householdSizeNormalized = 4/10 = 0.40
            // - 6 members  → householdSizeNormalized = 6/10 = 0.60
            // - 10 members → householdSizeNormalized = 10/10 = 1.00
            decimal householdSizeNormalized = Math.Min((decimal)totalMembers / MAX_MEMBERS, 1m);

            // =====================================================================
            // COMPOSITE NEED SCORE CALCULATION
            // =====================================================================
            // The final score is a weighted combination of the 4 factors above.
            // The weights have been calibrated to satisfy these test cases:
            //
            // CASE 1: 4 members, 2 children, ISEE €4,500 → HIGH
            //   (Family with children and low ISEE, needs assistance)
            //
            // CASE 2: 4 members, 0 children, ISEE €4,500 → MEDIUM
            //   (Same ISEE as case 1, but no children = less need)
            //
            // CASE 3: 4 members, 2 children, ISEE €9,000 → MEDIUM
            //   (Double ISEE compared to case 1, compensates for children)
            //
            // CASE 4: 6 members, 4 children, ISEE €9,000 → HIGH
            //   (Same ISEE as case 3, but 2 more children and 2 more members = high need)
            //
            // WEIGHT DISTRIBUTION:
            // - ISEE: 36.6% → Primary factor (economic situation)
            // - Absolute number of children: 31.4% → Second most important factor
            // - Family size: 20.0% → Significant impact
            // - Child percentage: 12.0% → Calculation refinement
            // TOTAL: 100%
            decimal needScore = (iseeScore * 0.366m) +                    // ISEE weight: 36.6%
                               (childRatio * 0.120m) +                    // Child percentage weight: 12.0%
                               (childrenNormalized * 0.314m) +            // Absolute children weight: 31.4%
                               (householdSizeNormalized * 0.200m);        // Family size weight: 20.0%

            // NORMALIZATION: Ensures the score is always between 0 and 1
            // (even though it should theoretically already be, this prevents rounding errors)
            needScore = Math.Max(0, Math.Min(1, needScore));

            // =====================================================================
            // ASSISTANCE LEVEL ASSIGNMENT
            // =====================================================================
            // The final score is mapped to 5 discrete assistance levels.
            // The higher the score, the greater the family's need.
            //
            // THRESHOLDS:
            // needScore >= 0.60 → VeryHigh  (Very high need, critical situation)
            // needScore >= 0.40 → High      (High need, family in difficulty)
            // needScore >= 0.25 → Medium    (Medium need, controlled situation)
            // needScore >= 0.10 → Low       (Low need, acceptable situation)
            // needScore <  0.10 → VeryLow   (Very low need, stable situation)
            if (needScore >= 0.60m)
                return AssistanceLevel.VeryHigh;
            if (needScore >= 0.40m)
                return AssistanceLevel.High;
            if (needScore >= 0.25m)
                return AssistanceLevel.Medium;
            if (needScore >= 0.10m)
                return AssistanceLevel.Low;

            return AssistanceLevel.VeryLow;
        }

        /// <summary>
        /// Enum that represents the necessity level of a family (scale from 0 to 4).
        /// Automatically determines the amount of food to be assigned to the family.
        /// </summary>
        public enum AssistanceLevel
        {
            /// <summary>Very High (0): very low ISEE and/or many children, critical situation</summary>
            VeryHigh = 0,

            /// <summary>High (1): medium-low ISEE, difficult economic situation</summary>
            High = 1,

            /// <summary>Medium (2): medium ISEE</summary>
            Medium = 2,

            /// <summary>Low (3): acceptable ISEE</summary>
            Low = 3,

            /// <summary>Very Low (4): good ISEE, stable economic situation</summary>
            VeryLow = 4
        }

    }
}