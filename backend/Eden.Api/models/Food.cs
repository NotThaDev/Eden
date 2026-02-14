using System.ComponentModel.DataAnnotations.Schema;
using Eden.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Eden.Api.Models
{
    [Index(nameof(Name), IsUnique = true)]
    public class Food
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; }

        // Size of a single unit, e.g., "500" for 500 grams, "2" for 2 kg
        public float UnitSize { get; set; } = 0;
        // eg. "kg", "liters", "pieces", "grams"
        public string Unit { get; set; } = string.Empty;

        public int? LatestLoadId { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public DateTime CreatedAt { get; set; }

        public static Task<List<Food>> GetFoodsAsync()
        {
            return EdenAppContext.Context.WithDbContext(db => db.Foods.OrderBy(f => f.CreatedAt).ToListAsync());
        }

        public static Task<Food?> GetFoodByIdAsync(int id)
        {
            return EdenAppContext.Context.WithDbContext(db => db.Foods.Where(f => f.Id == id).FirstOrDefaultAsync());
        }

        public static Task<List<Food>> GetFoodsByIdsAsync(List<int> ids)
        {
            return EdenAppContext.Context.WithDbContext(db => db.Foods.Where(f => ids.Contains(f.Id!.Value)).ToListAsync());
        }

        public static async Task<Food?> AddFood(Food food)
        {
            Food? newFood = null;

            try
            {

                await EdenAppContext.Context.WithDbContext(db =>
                {
                    newFood = db.Foods.Add(food).Entity;
                    return db.SaveChangesAsync();
                });

                return newFood;
            }

            // Handle unique constraint violation (duplicate food name)
            catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException pgEx && pgEx.SqlState == "23505")
            {
                throw new InvalidOperationException($"A food with the name '{food.Name}' already exists.", ex);
            }
        }

        public static async Task UpdateFoodsAsync(List<Food> foods)
        {
            try
            {
                await EdenAppContext.Context.WithDbContext(db =>
                {
                    db.UpdateRange(foods);
                    return db.SaveChangesAsync();
                });
            }

            // Handle unique constraint violation (duplicate food name) on update
            catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException pgEx && pgEx.SqlState == "23505")
            {
                throw new InvalidOperationException($"A food with the name '{string.Join(", ", foods.Select(f => f.Name))}' already exists.", ex);
            }
        }

        public async Task UpdateFoodAsync()
        {
            try
            {
                await EdenAppContext.Context.WithDbContext(db =>
                {
                    db.Update(this);
                    return db.SaveChangesAsync();
                });
            }

            // Handle unique constraint violation (duplicate food name) on update
            catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException pgEx && pgEx.SqlState == "23505")
            {
                throw new InvalidOperationException($"A food with the name '{Name}' already exists.", ex);
            }
        }

        public static async Task<bool> DeleteFoodAsync(int id)
        {
            var food = await GetFoodByIdAsync(id);
            if (food == null)
            {
                return false;
            }

            await EdenAppContext.Context.WithDbContext(db =>
            {
                db.Foods.Remove(food);
                return db.SaveChangesAsync();
            });

            return true;
        }

    }
}