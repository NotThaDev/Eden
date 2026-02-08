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
            var newBucket = CalculateNeedLevel(Isee, Children, Members);
            NecessityLevel = newBucket;
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
        /// Calculates the necessity level (FamilyBucket) of a family based on ISEE, number of children and total members.
        /// The algorithm evaluates two main factors:
        /// 1. ISEE per member: indicates the real economic availability per person
        /// 2. Child ratio: percentage of children on total members (children represent higher food expenses)
        /// </summary>
        /// <param name="isee">ISEE of the family (equivalent economic situation indicator)</param>
        /// <param name="children">Number of children in the family</param>
        /// <param name="totalMembers">Total number of members in the family</param>
        /// <returns>The calculated FamilyBucket for the family</returns>
        public static AssistanceLevel CalculateNeedLevel(int isee, uint children, uint totalMembers)
        {
            // Validation: if there are no members, the family is in a stable situation
            if (totalMembers == 0)
                return AssistanceLevel.VeryLow;

            // Calculate the percentage of children on the total
            decimal childRatio = (decimal)children / totalMembers;

            // ===== CRITICALITY THRESHOLDS =====
            // ISEE thresholds (max ISEE is 10,040 for families accessing this service)
            const decimal CRITICAL_ISEE = 3000;      // Critical situation (0-3000)
            const decimal HIGH_NEED_ISEE = 5000;     // High need (3000-5000)
            const decimal MEDIUM_NEED_ISEE = 7000;   // Medium need (5000-7000)
            const decimal STABLE_ISEE = 9000;        // Stable situation (7000-9000)
                                                     // Above 9000: Very low need

            // Child percentage thresholds (add weight to the evaluation)
            const decimal HIGH_CHILD_RATIO = 0.5m;    // 50% children = very serious
            const decimal MEDIUM_CHILD_RATIO = 0.33m; // 33% children = moderately serious

            // ===== ASSIGNMENT LOGIC =====
            // VERYHIGH: very low ISEE or low ISEE with many children (critical situation)
            if (isee < CRITICAL_ISEE || (isee < HIGH_NEED_ISEE && childRatio >= HIGH_CHILD_RATIO))
            {
                return AssistanceLevel.VeryHigh;
            }

            // HIGH: medium-low ISEE or medium ISEE with many children (high need)
            if (isee < HIGH_NEED_ISEE || (isee < MEDIUM_NEED_ISEE && childRatio >= MEDIUM_CHILD_RATIO))
            {
                return AssistanceLevel.High;
            }

            // MEDIUM: medium ISEE (medium need)
            if (isee < MEDIUM_NEED_ISEE)
            {
                return AssistanceLevel.Medium;
            }

            // LOW: acceptable ISEE (low need)
            if (isee < STABLE_ISEE)
            {
                return AssistanceLevel.Low;
            }

            // VERYLOW: good ISEE (very low need)
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