using System.Net;
using System.Net.Http.Json;
using Eden.Api.Models;
using Eden.Api.Tests.Fixtures;
using Eden.Api.Tests.Helpers;

namespace Eden.Api.Tests;

[Collection("api")]
public class LoadTests(EdenApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Create_Load_IncreasesFoodQuantity()
    {
        var food = await TestData.CreateFoodAsync(_client, quantity: 0);

        await TestData.CreateLoadAsync(_client, food.Id!.Value, 10);

        Assert.Equal(10, (await TestData.GetFoodAsync(_client, food.Id!.Value)).Quantity);
    }

    [Fact]
    public async Task Delete_Load_RestoresFoodQuantity()
    {
        var food = await TestData.CreateFoodAsync(_client, quantity: 0);
        var load = await TestData.CreateLoadAsync(_client, food.Id!.Value, 10);

        var response = await _client.DeleteAsync($"/api/load/{load.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(0, (await TestData.GetFoodAsync(_client, food.Id!.Value)).Quantity);
    }

    [Fact]
    public async Task Create_EmptyItems_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/load", new Load { LoadDate = DateTime.UtcNow, Items = [] });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_UnknownFood_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/load", new Load
        {
            LoadDate = DateTime.UtcNow,
            Items = [new LoadItem { FoodId = int.MaxValue, Quantity = 1 }]
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
