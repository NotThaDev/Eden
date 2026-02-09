using Eden.Api.Helpers;
using Microsoft.EntityFrameworkCore;

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

            await EdenAppContext.Context.WithDbContext(db =>
            {
                newDistribution = db.Distributions.Add(distribution).Entity;
                return db.SaveChangesAsync();
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

            await EdenAppContext.Context.WithDbContext(db =>
            {
                db.Distributions.Remove(distribution);
                return db.SaveChangesAsync();
            });

            return true;
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