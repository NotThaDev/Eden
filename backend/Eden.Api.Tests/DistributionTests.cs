using System.Net;
using System.Net.Http.Json;
using Eden.Api.DTOs;
using Eden.Api.Tests.Fixtures;
using Eden.Api.Tests.Helpers;

namespace Eden.Api.Tests;

[Collection("api")]
public class DistributionTests(EdenApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Create_Distribution_DecreasesStock()
    {
        var food = await TestData.CreateFoodAsync(_client, quantity: 10);
        var family = await TestData.CreateFamilyAsync(_client);

        var response = await _client.PostAsJsonAsync("/api/distribution", TestData.SingleFamilyDistribution(family.Id!.Value, food.Id!.Value, 4));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(6, (await TestData.GetFoodAsync(_client, food.Id!.Value)).Quantity);
    }

    [Fact]
    public async Task Delete_Distribution_RestoresStock()
    {
        var food = await TestData.CreateFoodAsync(_client, quantity: 10);
        var family = await TestData.CreateFamilyAsync(_client);
        var created = await (await _client.PostAsJsonAsync("/api/distribution", TestData.SingleFamilyDistribution(family.Id!.Value, food.Id!.Value, 4)))
            .Content.ReadFromJsonAsync<DistributionDto>();

        var response = await _client.DeleteAsync($"/api/distribution/{created!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(10, (await TestData.GetFoodAsync(_client, food.Id!.Value)).Quantity);
    }

    [Fact]
    public async Task Create_QuantityAboveStock_Returns400AndKeepsStock()
    {
        var food = await TestData.CreateFoodAsync(_client, quantity: 3);
        var family = await TestData.CreateFamilyAsync(_client);

        var response = await _client.PostAsJsonAsync("/api/distribution", TestData.SingleFamilyDistribution(family.Id!.Value, food.Id!.Value, 5));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(3, (await TestData.GetFoodAsync(_client, food.Id!.Value)).Quantity);
    }

    [Fact]
    public async Task Preview_AllocatesNoMoreThanStock()
    {
        var food = await TestData.CreateFoodAsync(_client, quantity: 10);
        var families = new[]
        {
            await TestData.CreateFamilyAsync(_client, members: 4, children: 2, isee: 4500),
            await TestData.CreateFamilyAsync(_client, members: 3, children: 0, isee: 9000)
        };
        var request = new DistributionPreviewDto
        {
            FamilyIds = families.Select(f => f.Id!.Value).ToList(),
            FoodIds = [food.Id!.Value]
        };

        var response = await _client.PostAsJsonAsync("/api/distribution/preview", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var preview = await response.Content.ReadFromJsonAsync<DistributionDto>();
        var allocated = preview!.Items.SelectMany(f => f.DistributionItems)
            .Where(i => i.FoodId == food.Id)
            .Sum(i => i.Quantity);
        Assert.True(allocated > 0);
        Assert.True(allocated <= 10);
    }
}
