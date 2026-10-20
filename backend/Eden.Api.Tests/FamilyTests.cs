using System.Net;
using System.Net.Http.Json;
using Eden.Api.DTOs;
using Eden.Api.Models;
using Eden.Api.Tests.Fixtures;
using Eden.Api.Tests.Helpers;

namespace Eden.Api.Tests;

[Collection("api")]
public class FamilyTests(EdenApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Create_ValidFamily_ComputesNecessityLevel()
    {
        var family = await TestData.CreateFamilyAsync(_client, members: 4, children: 2, isee: 4500);

        Assert.Equal(Family.AssistanceLevel.High, family.NecessityLevel);
    }

    [Fact]
    public async Task Create_ChildrenNotBelowMembers_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/family", new Family { Name = TestData.UniqueName("Family"), Members = 2, Children = 2, Isee = 4500 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_IseeAboveLimit_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/family", new Family { Name = TestData.UniqueName("Family"), Members = 4, Children = 2, Isee = 10041 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_ZeroMembers_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/family", new Family { Name = TestData.UniqueName("Family"), Members = 0, Children = 0, Isee = 4500 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Update_RecalculatesNecessityLevel()
    {
        var family = await TestData.CreateFamilyAsync(_client, members: 4, children: 2, isee: 4500);

        var response = await _client.PutAsJsonAsync($"/api/family/{family.Id}", new UpdateFamilyRequest { Isee = 9000 });

        var updated = await response.Content.ReadFromJsonAsync<Family>();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(Family.AssistanceLevel.Medium, updated!.NecessityLevel);
    }

    [Fact]
    public async Task Create_DefaultFamily_IsNotOccasional()
    {
        var family = await TestData.CreateFamilyAsync(_client);

        Assert.False(family.IsOccasional);
    }

    [Fact]
    public async Task Create_OccasionalFamily_PersistsFlag()
    {
        var family = await TestData.CreateFamilyAsync(_client, isOccasional: true);

        var response = await _client.GetAsync($"/api/family/{family.Id}");
        var fetched = await response.Content.ReadFromJsonAsync<Family>();
        Assert.True(fetched!.IsOccasional);
    }

    [Fact]
    public async Task Update_IsOccasional_IsKeptWhenOtherFieldsChange()
    {
        var family = await TestData.CreateFamilyAsync(_client);

        var toggled = await _client.PutAsJsonAsync($"/api/family/{family.Id}", new UpdateFamilyRequest { IsOccasional = true });
        Assert.True((await toggled.Content.ReadFromJsonAsync<Family>())!.IsOccasional);

        var renamed = await _client.PutAsJsonAsync($"/api/family/{family.Id}", new UpdateFamilyRequest { Name = "Renamed" });
        var updated = await renamed.Content.ReadFromJsonAsync<Family>();
        Assert.True(updated!.IsOccasional);
        Assert.Equal("Renamed", updated.Name);
    }

    [Fact]
    public async Task Delete_Returns204_ThenNotFound()
    {
        var family = await TestData.CreateFamilyAsync(_client);

        Assert.Equal(HttpStatusCode.NoContent, (await _client.DeleteAsync($"/api/family/{family.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync($"/api/family/{family.Id}")).StatusCode);
    }
}
