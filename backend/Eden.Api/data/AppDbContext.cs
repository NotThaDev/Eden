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
        public DbSet<Distribution> Distributions => Set<Distribution>();
        public DbSet<DistributionItem> DistributionItems => Set<DistributionItem>();
        public DbSet<DistributionAttendance> DistributionAttendances => Set<DistributionAttendance>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure the foreign key constraint for LatestLoadId
            modelBuilder.Entity<Food>()
                .HasOne<Load>()
                .WithMany()
                .HasForeignKey(f => f.LatestLoadId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<DistributionItem>()
                .HasOne(i => i.Family)
                .WithMany()
                .HasForeignKey(i => i.FamilyId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<DistributionItem>()
                .HasOne(i => i.Food)
                .WithMany()
                .HasForeignKey(i => i.FoodId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<DistributionAttendance>()
                .HasOne<Distribution>()
                .WithMany()
                .HasForeignKey(a => a.DistributionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DistributionAttendance>()
                .HasOne<Family>()
                .WithMany()
                .HasForeignKey(a => a.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);

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
