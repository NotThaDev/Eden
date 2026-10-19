using System.Net;
using System.Net.Http.Json;
using Eden.Api.DTOs;
using Eden.Api.Models;
using Eden.Api.Tests.Fixtures;
using Eden.Api.Tests.Helpers;

namespace Eden.Api.Tests;

[Collection("api")]
public class FamilyHistoryTests(EdenApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    // Past: present, absent, absent (oldest -> newest), plus one future distribution.
    private async Task<(Family family, int[] ids)> FamilyWithHistoryAsync()
    {
        var food = await TestData.CreateFoodAsync(_client, quantity: 10);
        var family = await TestData.CreateFamilyAsync(_client);
        var days = new[] { -21, -14, -7, 7 };
        var ids = new int[days.Length];
        for (var i = 0; i < days.Length; i++)
        {
            ids[i] = (await TestData.CreateDistributionAsync(_client, family.Id!.Value, food.Id!.Value, DateTime.UtcNow.AddDays(days[i]))).Id!.Value;
        }
        bool[] present = [true, false, false];
        for (var i = 0; i < present.Length; i++)
        {
            (await _client.PutAsJsonAsync($"/api/distribution/{ids[i]}/attendance",
                new List<DistributionAttendanceDto> { new() { FamilyId = family.Id!.Value, Present = present[i] } })).EnsureSuccessStatusCode();
        }
        return (family, ids);
    }

    [Fact]
    public async Task GetDistributions_ReturnsNewestFirstWithAttendance()
    {
        var (family, ids) = await FamilyWithHistoryAsync();

        var response = await _client.GetAsync($"/api/family/{family.Id}/distributions");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var history = await response.Content.ReadFromJsonAsync<List<FamilyDistributionDto>>();
        Assert.Equal(new[] { ids[3], ids[2], ids[1], ids[0] }, history!.Select(r => r.DistributionId));
        Assert.Equal(new bool?[] { null, false, false, true }, history!.Select(r => r.Present));
    }

    [Fact]
    public async Task GetDistributions_UnknownFamily_Returns404()
    {
        var response = await _client.GetAsync($"/api/family/{int.MaxValue}/distributions");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task HistorySummary_ReturnsSkippedStreak()
    {
        var (family, _) = await FamilyWithHistoryAsync();

        var summary = await _client.GetFromJsonAsync<Dictionary<int, int>>("/api/family/history-summary");

        // Future distribution is ignored; the present at -21 days stops the streak.
        Assert.Equal(2, summary![family.Id!.Value]);
    }

    [Fact]
    public async Task HistorySummary_FamilyWithoutDistributions_IsAbsent()
    {
        var family = await TestData.CreateFamilyAsync(_client);

        var summary = await _client.GetFromJsonAsync<Dictionary<int, int>>("/api/family/history-summary");

        Assert.False(summary!.ContainsKey(family.Id!.Value));
    }
}
