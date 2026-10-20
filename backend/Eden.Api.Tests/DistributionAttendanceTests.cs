using System.Net;
using System.Net.Http.Json;
using Eden.Api.Data;
using Eden.Api.DTOs;
using Eden.Api.Models;
using Eden.Api.Tests.Fixtures;
using Eden.Api.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Eden.Api.Tests;

[Collection("api")]
public class DistributionAttendanceTests(EdenApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<(Eden.Api.Models.Family family, DistributionDto distribution)> PastDistributionAsync()
    {
        var food = await TestData.CreateFoodAsync(_client, quantity: 10);
        var family = await TestData.CreateFamilyAsync(_client);
        var distribution = await TestData.CreateDistributionAsync(_client, family.Id!.Value, food.Id!.Value, DateTime.UtcNow.AddDays(-7));
        return (family, distribution);
    }

    private static string AttendanceUrl(int distributionId) => $"/api/distribution/{distributionId}/attendance";

    [Fact]
    public async Task Get_NewDistribution_ListsFamilyAsAbsent()
    {
        var (family, distribution) = await PastDistributionAsync();

        var response = await _client.GetAsync(AttendanceUrl(distribution.Id!.Value));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var attendance = await response.Content.ReadFromJsonAsync<List<DistributionAttendance>>();
        var row = Assert.Single(attendance!);
        Assert.Equal(family.Id, row.FamilyId);
        Assert.Equal(family.Name, row.Family?.Name);
        Assert.False(row.Present);
    }

    [Fact]
    public async Task Put_PastDistribution_PersistsAndUpdatesAttendance()
    {
        var (family, distribution) = await PastDistributionAsync();
        var url = AttendanceUrl(distribution.Id!.Value);

        var first = await _client.PutAsJsonAsync(url, new List<DistributionAttendance> { new() { FamilyId = family.Id!.Value, Present = true } });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var afterFirst = await _client.GetFromJsonAsync<List<DistributionAttendance>>(url);
        Assert.True(Assert.Single(afterFirst!).Present);

        var second = await _client.PutAsJsonAsync(url, new List<DistributionAttendance> { new() { FamilyId = family.Id!.Value, Present = false } });
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        var afterSecond = await _client.GetFromJsonAsync<List<DistributionAttendance>>(url);
        Assert.False(Assert.Single(afterSecond!).Present);
    }

    [Fact]
    public async Task Put_FutureDistribution_Returns400()
    {
        var food = await TestData.CreateFoodAsync(_client, quantity: 10);
        var family = await TestData.CreateFamilyAsync(_client);
        var distribution = await TestData.CreateDistributionAsync(_client, family.Id!.Value, food.Id!.Value, DateTime.UtcNow.AddDays(1));

        var response = await _client.PutAsJsonAsync(AttendanceUrl(distribution.Id!.Value),
            new List<DistributionAttendance> { new() { FamilyId = family.Id!.Value, Present = true } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_FamilyNotInDistribution_Returns400()
    {
        var (family, distribution) = await PastDistributionAsync();
        var other = await TestData.CreateFamilyAsync(_client);
        var url = AttendanceUrl(distribution.Id!.Value);

        var response = await _client.PutAsJsonAsync(url, new List<DistributionAttendance> { new() { FamilyId = other.Id!.Value, Present = true } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var attendance = await _client.GetFromJsonAsync<List<DistributionAttendance>>(url);
        Assert.False(Assert.Single(attendance!, a => a.FamilyId == family.Id!.Value).Present);
    }

    [Fact]
    public async Task Attendance_UnknownDistribution_Returns404()
    {
        var url = AttendanceUrl(int.MaxValue);

        var get = await _client.GetAsync(url);
        var put = await _client.PutAsJsonAsync(url, new List<DistributionAttendance>());

        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, put.StatusCode);
    }

    [Fact]
    public async Task Delete_Distribution_RemovesAttendance()
    {
        var (family, distribution) = await PastDistributionAsync();
        await _client.PutAsJsonAsync(AttendanceUrl(distribution.Id!.Value),
            new List<DistributionAttendance> { new() { FamilyId = family.Id!.Value, Present = true } });

        var response = await _client.DeleteAsync($"/api/distribution/{distribution.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.False(await db.DistributionAttendances.AnyAsync(a => a.DistributionId == distribution.Id));
    }
}
