using Eden.Api.Data;
using Eden.Api.Helpers;
using Microsoft.EntityFrameworkCore;
using static Eden.Api.Models.Family;

namespace Eden.Api.Models
{
    public class Distribution
    {
        public int? Id { get; set; }

        private DateTime _distributionDate;
        public DateTime DistributionDate
        {
            get => _distributionDate;
            set => _distributionDate = value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();
        }

        public List<DistributionItem> Items { get; set; } = [];

        public static Task<List<Distribution>> GetDistributionsAsync()
        {
            return EdenAppContext.Context.WithDbContext(db =>
                db.Distributions
                    .Include(d => d.Items.Where(i => i.FoodId != null))
                    .ThenInclude(i => i.Family)
                    .Include(d => d.Items.Where(i => i.FoodId != null))
                    .ThenInclude(i => i.Food)
                    .OrderByDescending(d => d.DistributionDate)
                    .ToListAsync());
        }

        public static Task<Distribution?> GetDistributionByIdAsync(int id)
        {
            return EdenAppContext.Context.WithDbContext(db =>
                db.Distributions
                    .Where(d => d.Id == id)
                    .Include(d => d.Items.Where(i => i.FoodId != null))
                    .ThenInclude(i => i.Family)
                    .Include(d => d.Items.Where(i => i.FoodId != null))
                    .ThenInclude(i => i.Food)
                    .FirstOrDefaultAsync());
        }

        public static async Task<Distribution?> AddDistribution(Distribution distribution)
        {
            // Distribution and stock changes are saved together, so a failure rolls back both
            await EdenAppContext.Context.WithDbContext<int>(async db =>
            {
                db.Distributions.Add(distribution);
                await AdjustFoodQuantities(db, ToFoodDeltas(distribution.Items, -1));
                return await db.SaveChangesAsync();
            });

            if (distribution.Id == null)
            {
                return null;
            }

            return await GetDistributionByIdAsync(distribution.Id.Value);
        }

        public static Task<bool> DeleteDistributionAsync(int id)
        {
            return EdenAppContext.Context.WithDbContext<bool>(async db =>
            {
                var distribution = await db.Distributions
                    .Include(d => d.Items)
                    .FirstOrDefaultAsync(d => d.Id == id);
                if (distribution == null)
                {
                    return false;
                }

                await AdjustFoodQuantities(db, ToFoodDeltas(distribution.Items, 1));
                db.Distributions.Remove(distribution);
                await db.SaveChangesAsync();
                return true;
            });
        }

        public static async Task<Distribution?> UpdateDistributionAsync(Distribution distribution)
        {
            var updated = await EdenAppContext.Context.WithDbContext<bool>(async db =>
            {
                var existingDistribution = await db.Distributions
                    .Include(d => d.Items)
                    .FirstOrDefaultAsync(d => d.Id == distribution.Id);
                if (existingDistribution == null)
                {
                    return false;
                }

                existingDistribution.DistributionDate = distribution.DistributionDate;

                // Incoming items carry no ids, so the update replaces all items: give back the old stock, take the new one
                var deltas = ToFoodDeltas(existingDistribution.Items, 1);
                foreach (var (foodId, delta) in ToFoodDeltas(distribution.Items, -1))
                {
                    deltas[foodId] = deltas.GetValueOrDefault(foodId) + delta;
                }

                existingDistribution.Items.Clear();
                existingDistribution.Items.AddRange(distribution.Items);
                await AdjustFoodQuantities(db, deltas);
                await db.SaveChangesAsync();
                return true;
            });

            return updated ? await GetDistributionByIdAsync(distribution.Id ?? 0) : null;
        }

        /// <summary>
        /// Builds a new distribution by allocating available food quantities across families,
        /// prioritizing higher necessity levels first and then family size criteria.
        /// Only the foods with quantity greater than zero will be considered for distribution.
        /// </summary>
        /// <param name="families">Families to include in the distribution.</param>
        /// <param name="foods">Foods with current available quantities.</param>
        /// <returns>
        /// A distribution containing calculated <see cref="DistributionItem"/> entries and the current UTC distribution date.
        /// </returns>
        public static async Task<Distribution> BuildDistributionFromFamilies(List<Family> families, List<Food> foods)
        {
            // Sort families by priority within each assistance level:
            // 1. AssistanceLevel (desc)
            // 2. Children (desc) - more children = higher priority
            // 3. Members (desc) - more members = higher priority
            var sortedFamilies = families
                .OrderByDescending(f => f.NecessityLevel)
                .ThenByDescending(f => f.Children)
                .ThenByDescending(f => f.Members)
                .ToList();

            var familyGroupedByAssistanceLevel = sortedFamilies
                .GroupBy(f => f.NecessityLevel)
                .ToDictionary(g => g.Key, g => g.ToArray());

            // Ordered from highest to lowest assistance level, so that we distribute first to the most in need families
            Dictionary<AssistanceLevel, double> familiesAssistanceLevelPercentages = new Dictionary<AssistanceLevel, double>
            {
                { AssistanceLevel.VeryHigh, familyGroupedByAssistanceLevel.TryGetValue(AssistanceLevel.VeryHigh, out Family[]? veryHighFamilies) ? veryHighFamilies.Length / (double)families.Count : 0 },
                { AssistanceLevel.High, familyGroupedByAssistanceLevel.TryGetValue(AssistanceLevel.High, out Family[]? highFamilies) ? highFamilies.Length / (double)families.Count : 0 },
                { AssistanceLevel.Medium, familyGroupedByAssistanceLevel.TryGetValue(AssistanceLevel.Medium, out Family[]? mediumFamilies) ? mediumFamilies.Length / (double)families.Count : 0 },
                { AssistanceLevel.Low, familyGroupedByAssistanceLevel.TryGetValue(AssistanceLevel.Low, out Family[]? lowFamilies) ? lowFamilies.Length / (double)families.Count : 0 },
                { AssistanceLevel.VeryLow, familyGroupedByAssistanceLevel.TryGetValue(AssistanceLevel.VeryLow, out Family[]? veryLowFamilies) ? veryLowFamilies.Length / (double)families.Count : 0 }
            };

            List<DistributionItem> distributableItems = [];

            // For each food, distribute based on assistance level percentages
            foreach (var food in foods.Where(f => f.Quantity > 0))
            {
                var totalQuantity = food.Quantity;
                foreach (var assistanceLevel in familiesAssistanceLevelPercentages)
                {
                    if (assistanceLevel.Value == 0) continue; // Skip if no families at this level

                    // Calculate quantity for this assistance level
                    var quantityForLevel = (int)(totalQuantity * assistanceLevel.Value);

                    // Get families at this assistance level (already sorted by Children desc, then Members desc)
                    if (familyGroupedByAssistanceLevel.TryGetValue(assistanceLevel.Key, out var familiesAtLevel))
                    {
                        // Split equally among families at this level
                        var quantityPerFamily = quantityForLevel / familiesAtLevel.Length;
                        var remainder = quantityForLevel % familiesAtLevel.Length;

                        // Families with higher priority (more children, more members) get the remainder first
                        foreach (var family in familiesAtLevel)
                        {
                            var quantity = quantityPerFamily + (remainder > 0 ? 1 : 0);
                            totalQuantity -= quantity; // Decrease the available quantity of the food

                            if (quantity > 0)
                            {
                                distributableItems.Add(new DistributionItem
                                {
                                    Family = family,
                                    FamilyId = family.Id,
                                    FoodId = food.Id,
                                    Food = food,
                                    Quantity = quantity
                                });
                            }
                            if (remainder > 0)
                            {
                                remainder--;
                            }
                        }
                    }
                }
            }

            return new Distribution
            {
                Items = distributableItems,
                DistributionDate = DateTime.UtcNow
            };
        }

        private static Dictionary<int, int> ToFoodDeltas(IEnumerable<DistributionItem> items, int sign)
        {
            return items
                .Where(i => i.FoodId != null)
                .GroupBy(i => i.FoodId!.Value)
                .ToDictionary(g => g.Key, g => sign * g.Sum(i => i.Quantity));
        }

        /// <summary>
        /// Applies quantity deltas to foods tracked by <paramref name="db"/>. Changes are persisted by the caller's SaveChangesAsync.
        /// </summary>
        private static async Task AdjustFoodQuantities(AppDbContext db, Dictionary<int, int> deltas)
        {
            var foodIds = deltas.Keys.ToList();
            var foods = await db.Foods.Where(f => foodIds.Contains(f.Id!.Value)).ToListAsync();

            foreach (var food in foods)
            {
                food.Quantity += deltas[food.Id!.Value];
            }
        }
    }


    public class DistributionItem
    {
        public int? Id { get; set; }
        public int DistributionId { get; set; }
        public int? FamilyId { get; set; }
        public int? FoodId { get; set; }
        public int Quantity { get; set; }

        public Family? Family { get; set; }
        public Food? Food { get; set; }
    }
}