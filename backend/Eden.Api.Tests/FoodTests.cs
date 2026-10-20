using System.Net;
using System.Net.Http.Json;
using Eden.Api.DTOs;
using Eden.Api.Models;
using Eden.Api.Tests.Fixtures;
using Eden.Api.Tests.Helpers;

namespace Eden.Api.Tests;

[Collection("api")]
public class FoodTests(EdenApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Create_ValidFood_Returns201AndCanBeFetched()
    {
        var name = TestData.UniqueName("Pasta");
        var response = await _client.PostAsJsonAsync("/api/food", new Food { Name = name, Quantity = 5, UnitSize = 500, Unit = "grams" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<Food>();
        var fetched = await TestData.GetFoodAsync(_client, created!.Id!.Value);
        Assert.Equal(name, fetched.Name);
        Assert.Equal(5, fetched.Quantity);
    }

    [Fact]
    public async Task Create_NegativeQuantity_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/food", new Food { Name = TestData.UniqueName("Rice"), Quantity = -1, UnitSize = 1, Unit = "kg" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_MissingUnit_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/food", new Food { Name = TestData.UniqueName("Rice"), Quantity = 1, UnitSize = 1, Unit = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_DuplicateName_Returns409()
    {
        var food = await TestData.CreateFoodAsync(_client);
        var response = await _client.PostAsJsonAsync("/api/food", new Food { Name = food.Name, Quantity = 1, UnitSize = 1, Unit = "kg" });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Update_ChangesQuantity()
    {
        var food = await TestData.CreateFoodAsync(_client, quantity: 1);
        var response = await _client.PutAsJsonAsync($"/api/food/{food.Id}", new UpdateFoodRequest { Quantity = 7 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(7, (await TestData.GetFoodAsync(_client, food.Id!.Value)).Quantity);
    }

    [Fact]
    public async Task Delete_Returns204_ThenNotFound()
    {
        var food = await TestData.CreateFoodAsync(_client);

        Assert.Equal(HttpStatusCode.NoContent, (await _client.DeleteAsync($"/api/food/{food.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/food/{food.Id}")).StatusCode);
    }
}
