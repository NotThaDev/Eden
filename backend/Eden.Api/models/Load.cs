using System.Threading.Tasks;
using Eden.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Eden.Api.Models
{
    public class Load
    {
        public int? Id { get; set; }

        public DateTime LoadDate { get; set; }

        // Navigation
        public List<LoadItem> Items { get; set; } = new List<LoadItem>();

        public static Task<List<Load>> GetLoadsAsync()
        {
            return EdenAppContext.Context.WithDbContext(db =>
            {
                // Here we can return the Loads with a list of Food Name and Quantity
                return db.Loads
                           .Include(l => l.Items)
                           .ThenInclude(i => i.Food)
                           .OrderBy(l => l.LoadDate)
                           .ToListAsync();
            });
        }

        public static Task<Load?> GetLoadByIdAsync(int id)
        {
            return EdenAppContext.Context.WithDbContext(db =>
                db.Loads
                    .Include(l => l.Items)
                    .ThenInclude(i => i.Food)
                    .Where(l => l.Id == id)
                    .FirstOrDefaultAsync());
        }

        public static async Task<Load?> AddLoad(Load load)
        {
            Load? newLoad = null;

            await EdenAppContext.Context.WithDbContext(db =>
            {
                newLoad = db.Loads.Add(load).Entity;
                return db.SaveChangesAsync();
            });

            if (newLoad != null)
            {
                await UpdateFoodQuantities(newLoad.Items, newLoad.Id ?? 0);
            }


            return newLoad?.Id.HasValue == true ? await GetLoadByIdAsync(newLoad.Id.Value) : null;
        }

        public async Task<Load> UpdateLoadAsync()
        {
            List<LoadItem> updatedItems = [];
            List<LoadItem> removedItems = [];

            if (!Id.HasValue)
            {
                throw new InvalidOperationException("Load must have an Id to be updated.");
            }
            var existingLoad = await GetLoadByIdAsync(Id.Value) ?? throw new InvalidOperationException($"Load with Id {Id.Value} does not exist.");

            await EdenAppContext.Context.WithDbContext(db =>
            {
                existingLoad.LoadDate = LoadDate;

                var itemsToRemove = existingLoad.Items
                    .Where(existingItem => !Items.Any(newItem => newItem.FoodId == existingItem.FoodId))
                    .ToList();

                foreach (var item in itemsToRemove)
                {
                    // Use the already tracked Food from the navigation property
                    var food = item.Food ?? throw new InvalidOperationException($"Food with Id {item.FoodId} does not exist.");
                    if (food.Quantity < item.Quantity)
                    {
                        throw new InvalidOperationException($"Cannot remove {item.Quantity} of '{food.Name}' as it would result in negative stock.");
                    }

                    existingLoad.Items.Remove(item);
                    // Track removed items to subtract their quantities
                    removedItems.Add(new LoadItem
                    {
                        FoodId = item.FoodId,
                        Quantity = -item.Quantity // Negative to subtract from food quantity
                    });
                    db.LoadItems.Remove(item);
                }

                // Add new items or update existing ones
                foreach (var newItem in Items)
                {
                    var existingItem = existingLoad.Items
                        .FirstOrDefault(ei => ei.FoodId == newItem.FoodId);

                    if (existingItem != null)
                    {
                        if (existingItem.Quantity != newItem.Quantity)
                        {
                            // Update existing item
                            updatedItems.Add(new LoadItem
                            {
                                FoodId = existingItem.FoodId,
                                Quantity = newItem.Quantity - existingItem.Quantity
                            });
                            existingItem.Quantity = newItem.Quantity;
                        }
                    }
                    else
                    {
                        // Add new item
                        if (db.Foods.Find(newItem.FoodId) == null)
                        {
                            throw new InvalidOperationException($"Food with Id {newItem.FoodId} does not exist.");
                        }

                        existingLoad.Items.Add(newItem);
                        updatedItems.Add(newItem);
                    }
                }

                db.Update(existingLoad);
                return db.SaveChangesAsync();
            });

            if (updatedItems.Count > 0)
            {
                await UpdateFoodQuantities(updatedItems, Id.Value);
            }

            if (removedItems.Count > 0)
            {
                await UpdateFoodQuantities(removedItems, Id.Value);
            }

            return await GetLoadByIdAsync(Id.Value) ?? throw new InvalidOperationException($"Load with Id {Id.Value} does not exist anymore after update.");
        }

        public static async Task<bool> DeleteLoadAsync(int id)
        {
            var load = await GetLoadByIdAsync(id);
            if (load == null)
            {
                return false;
            }

            await EdenAppContext.Context.WithDbContext(db =>
            {
                db.Loads.Remove(load);
                return db.SaveChangesAsync();
            });

            var loadItems = load.Items.Select(li => new LoadItem
            {
                FoodId = li.FoodId,
                Quantity = -li.Quantity // Subtract the quantities added by this load
            }).ToList();
            await UpdateFoodQuantities(loadItems, id);

            return true;
        }

        private static async Task UpdateFoodQuantities(List<LoadItem> loadItems, int loadId)
        {
            foreach (var item in loadItems)
            {
                var food = await Food.GetFoodByIdAsync(item.FoodId);
                if (food is null) continue;
                
                food.Quantity += item.Quantity;
                
                // Only update LatestLoadId if we're adding items (positive quantity)
                if (item.Quantity > 0)
                {
                    food.LatestLoadId = loadId;
                }
                
                await food.UpdateFoodAsync();
            }
        }

    }

    public class LoadItem
    {
        public int? Id { get; set; }
        public int FoodId { get; set; }
        public int LoadId { get; set; }
        public int Quantity { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation Items
        public Food? Food { get; set; }
    }
}