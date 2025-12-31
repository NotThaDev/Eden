using Eden.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Eden.Api.Data
{
    public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        public DbSet<Family> Families => Set<Family>();
        public DbSet<Food> Foods => Set<Food>();
        public DbSet<Load> Loads => Set<Load>();
        public DbSet<LoadItem> LoadItems => Set<LoadItem>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                var createdAtProperty = entityType.ClrType.GetProperty("CreatedAt");
                if (createdAtProperty != null && createdAtProperty.PropertyType == typeof(DateTime))
                {
                    modelBuilder.Entity(entityType.Name)
                        .Property("CreatedAt")
                        .HasDefaultValueSql("NOW()");
                }
            }
        }
    }
}
