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
                    .Include(d => d.Items)
                    .ThenInclude(i => i.Family)
                    .Include(d => d.Items)
                    .ThenInclude(i => i.Food)
                    .OrderByDescending(d => d.DistributionDate)
                    .ToListAsync());
        }

        public static Task<Distribution?> GetDistributionByIdAsync(int id)
        {
            return EdenAppContext.Context.WithDbContext(db =>
                db.Distributions
                    .Where(d => d.Id == id)
                    .Include(d => d.Items)
                    .ThenInclude(i => i.Family)
                    .Include(d => d.Items)
                    .ThenInclude(i => i.Food)
                    .FirstOrDefaultAsync());
        }

        public static async Task<Distribution?> AddDistribution(Distribution distribution)
        {
            Distribution? newDistribution = null;

            await EdenAppContext.Context.WithDbContext(async db =>
            {
                newDistribution = db.Distributions.Add(distribution).Entity;
                
                // Update food quantities in the same transaction
                var foodIds = distribution.Items.Select(i => i.FoodId ?? 0).ToList();
                var foods = await db.Foods.Where(f => foodIds.Contains(f.Id!.Value)).ToListAsync();
                
                foreach (var item in distribution.Items)
                {
                    var food = foods.FirstOrDefault(f => f.Id == item.FoodId);
                    if (food != null)
                    {
                        food.Quantity -= item.Quantity;
                    }
                }
                
                await db.SaveChangesAsync();
            });

            if (newDistribution?.Id == null)
            {
                return null;
            }

            return await GetDistributionByIdAsync(newDistribution.Id!.Value);
        }

        public static async Task<bool> DeleteDistributionAsync(int id)
        {
            var distribution = await GetDistributionByIdAsync(id);
            if (distribution == null)
            {
                return false;
            }

            await EdenAppContext.Context.WithDbContext(async db =>
            {
                // Remove the distribution
                db.Distributions.Remove(distribution);
                
                // Restore food quantities in the same transaction
                var foodIds = distribution.Items.Select(i => i.FoodId ?? 0).ToList();
                var foods = await db.Foods.Where(f => foodIds.Contains(f.Id!.Value)).ToListAsync();
                
                foreach (var item in distribution.Items)
                {
                    var food = foods.FirstOrDefault(f => f.Id == item.FoodId);
                    if (food != null)
                    {
                        food.Quantity += item.Quantity;
                    }
                }
                
                await db.SaveChangesAsync();
            });

            return true;
        }

        public static async Task<Distribution?> UpdateDistributionAsync(Distribution distribution)
        {
            var existingDistribution = await GetDistributionByIdAsync(distribution.Id ?? 0);
            if (existingDistribution == null)
            {
                return null;
            }

            existingDistribution.DistributionDate = distribution.DistributionDate;
            existingDistribution.Items = distribution.Items;

            List<LoadItem> changedItems = [];
            existingDistribution.Items.ForEach(i =>
            {
                var matchingItem = distribution.Items.FirstOrDefault(di => di.Id == i.Id);
                if (matchingItem != null && matchingItem.Quantity != i.Quantity)
                {
                    changedItems.Add(new LoadItem
                    {
                        FoodId = i.FoodId ?? 0,
                        Quantity = matchingItem.Quantity - i.Quantity
                    });
                }
            });

            await EdenAppContext.Context.WithDbContext(async db =>
            {
                db.Distributions.Update(existingDistribution);
                
                // Update food quantities in the same transaction if there are changes
                if (changedItems.Count > 0)
                {
                    var foodIds = changedItems.Select(li => li.FoodId).ToList();
                    var foods = await db.Foods.Where(f => foodIds.Contains(f.Id!.Value)).ToListAsync();

                    foreach (var item in changedItems)
                    {
                        var food = foods.FirstOrDefault(f => f.Id == item.FoodId);
                        if (food != null)
                        {
                            food.Quantity += item.Quantity;
                        }
                    }
                }
                
                await db.SaveChangesAsync();
            });

            return await GetDistributionByIdAsync(existingDistribution.Id ?? 0);
        }

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
            foreach (var food in foods)
            {
                foreach (var assistanceLevel in familiesAssistanceLevelPercentages)
                {
                    if (assistanceLevel.Value == 0) continue; // Skip if no families at this level

                    // Calculate quantity for this assistance level
                    var quantityForLevel = (int)(food.Quantity * assistanceLevel.Value);

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
                            food.Quantity -= quantity; // Decrease the available quantity of the food

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
                            remainder--;
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