using System.ComponentModel.DataAnnotations.Schema;
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

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public DateTime CreatedAt { get; set; }

        public static Task<List<Family>> GetFamiliesAsync()
        {
            return EdenAppContext.Context.WithDbContext(db => db.Families.ToListAsync());
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
                newFamily = db.Families.Add(family).Entity;
                return db.SaveChangesAsync();
            });

            return newFamily;
        }

        public Task UpdateFamilyAsync()
        {
            return EdenAppContext.Context.WithDbContext(db =>
            {
                db.Update(this);
                return db.SaveChangesAsync();
            });
        }

        public static async Task<bool> DeleteFamilyAsync(int id)
        {
            var family = await GetFamilyByIdAsync(id);
            if(family == null)
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

    }
}