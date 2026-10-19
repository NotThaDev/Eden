using System.Net.Http.Json;
using Eden.Api.DTOs;
using Eden.Api.Models;

namespace Eden.Api.Tests.Helpers;

// Creates uniquely named entities through the HTTP API so each test only asserts on its own data.
public static class TestData
{
    public static string UniqueName(string prefix) => $"{prefix}-{Guid.NewGuid():N}";

    public static async Task<Food> CreateFoodAsync(HttpClient client, int quantity = 0)
    {
        var response = await client.PostAsJsonAsync("/api/food",
            new Food { Name = UniqueName("Food"), Quantity = quantity, UnitSize = 1, Unit = "kg" });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<Food>())!;
    }

    public static async Task<Family> CreateFamilyAsync(HttpClient client, uint members = 4, uint children = 2, int isee = 4500)
    {
        var response = await client.PostAsJsonAsync("/api/family",
            new Family { Name = UniqueName("Family"), Members = members, Children = children, Isee = isee });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<Family>())!;
    }

    public static async Task<Load> CreateLoadAsync(HttpClient client, int foodId, int quantity)
    {
        var response = await client.PostAsJsonAsync("/api/load", new Load
        {
            LoadDate = DateTime.UtcNow,
            Items = [new LoadItem { FoodId = foodId, Quantity = quantity }]
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<Load>())!;
    }

    public static DistributionDto SingleFamilyDistribution(int familyId, int foodId, int quantity) => new()
    {
        Items =
        [
            new DistributionFamilyDto
            {
                FamilyId = familyId,
                DistributionItems = [new DistributionItemDto { FoodId = foodId, Quantity = quantity }]
            }
        ]
    };

    public static async Task<Food> GetFoodAsync(HttpClient client, int id)
    {
        var food = await client.GetFromJsonAsync<Food>($"/api/food/{id}");
        return food!;
    }
}
