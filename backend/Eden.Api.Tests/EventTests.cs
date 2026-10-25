using System.Net;
using System.Net.Http.Json;
using Eden.Api.Models;
using Eden.Api.Tests.Fixtures;
using Eden.Api.Tests.Helpers;

namespace Eden.Api.Tests;

[Collection("api")]
public class EventTests(EdenApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    private static string Range(DateTime from, DateTime to) =>
        $"/api/event?from={Uri.EscapeDataString(from.ToString("o"))}&to={Uri.EscapeDataString(to.ToString("o"))}";

    private static void AssertSameInstant(DateTime expected, DateTime actual) =>
        Assert.True(Math.Abs((expected.ToUniversalTime() - actual.ToUniversalTime()).TotalSeconds) < 1,
            $"Expected {expected:o}, got {actual:o}");

    private async Task<Event> CreateAsync(Event ev)
    {
        var response = await _client.PostAsJsonAsync("/api/event", ev);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<Event>())!;
    }

    [Fact]
    public async Task Create_ThenGetById_ReturnsEvent()
    {
        var start = new DateTime(2031, 1, 10, 10, 0, 0, DateTimeKind.Utc);
        var created = await CreateAsync(new Event { Title = TestData.UniqueName("Ev"), Start = start });

        var fetched = await _client.GetFromJsonAsync<Event>($"/api/event/{created.Id}");

        Assert.Equal(created.Id, fetched!.Id);
        AssertSameInstant(start, fetched.Start);
    }

    [Fact]
    public async Task Update_ThenDelete_RemovesEvent()
    {
        var created = await CreateAsync(new Event { Title = TestData.UniqueName("Ev"), Start = new DateTime(2031, 2, 10, 9, 0, 0, DateTimeKind.Utc) });
        var newTitle = TestData.UniqueName("Renamed");

        var put = await _client.PutAsJsonAsync($"/api/event/{created.Id}",
            new Event { Title = newTitle, Start = created.Start, AllDay = true });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        Assert.Equal(newTitle, (await put.Content.ReadFromJsonAsync<Event>())!.Title);

        var delete = await _client.DeleteAsync($"/api/event/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        var fetched = await _client.GetAsync($"/api/event/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, fetched.StatusCode);
    }

    [Fact]
    public async Task GetAll_ReturnsOnlyEventsOverlappingRange()
    {
        var inside = await CreateAsync(new Event { Title = TestData.UniqueName("Inside"), Start = new DateTime(2031, 5, 10, 10, 0, 0, DateTimeKind.Utc) });
        var spanning = await CreateAsync(new Event
        {
            Title = TestData.UniqueName("Spanning"),
            Start = new DateTime(2031, 5, 9, 22, 0, 0, DateTimeKind.Utc),
            End = new DateTime(2031, 5, 10, 12, 0, 0, DateTimeKind.Utc)
        });
        var after = await CreateAsync(new Event { Title = TestData.UniqueName("After"), Start = new DateTime(2031, 5, 11, 10, 0, 0, DateTimeKind.Utc) });
        var before = await CreateAsync(new Event
        {
            Title = TestData.UniqueName("Before"),
            Start = new DateTime(2031, 5, 9, 10, 0, 0, DateTimeKind.Utc),
            End = new DateTime(2031, 5, 9, 11, 0, 0, DateTimeKind.Utc)
        });

        var ids = (await _client.GetFromJsonAsync<List<Event>>(Range(
            new DateTime(2031, 5, 10, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2031, 5, 11, 0, 0, 0, DateTimeKind.Utc))))!.Select(e => e.Id).ToList();

        Assert.Contains(inside.Id, ids);
        Assert.Contains(spanning.Id, ids);
        Assert.DoesNotContain(after.Id, ids);
        Assert.DoesNotContain(before.Id, ids);
    }

    [Fact]
    public async Task GetAll_WithoutRange_ReturnsBadRequest()
    {
        var response = await _client.GetAsync("/api/event");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_EmptyTitle_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/event",
            new Event { Title = "  ", Start = new DateTime(2031, 6, 10, 9, 0, 0, DateTimeKind.Utc) });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_EndBeforeStart_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/event", new Event
        {
            Title = TestData.UniqueName("Ev"),
            Start = new DateTime(2031, 6, 10, 9, 0, 0, DateTimeKind.Utc),
            End = new DateTime(2031, 6, 10, 8, 0, 0, DateTimeKind.Utc)
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithDistributionId_IgnoresIt()
    {
        var response = await _client.PostAsJsonAsync("/api/event", new
        {
            title = TestData.UniqueName("Ev"),
            start = new DateTime(2031, 8, 10, 9, 0, 0, DateTimeKind.Utc),
            allDay = false,
            distributionId = 123
        });

        response.EnsureSuccessStatusCode();
        var created = (await response.Content.ReadFromJsonAsync<Event>())!;
        Assert.Null(created.DistributionId);
    }

    [Fact]
    public async Task Distribution_CreateMovesAndDeleteSyncsCalendarEvent()
    {
        var food = await TestData.CreateFoodAsync(_client, quantity: 10);
        var family = await TestData.CreateFamilyAsync(_client);
        var date = new DateTime(2031, 9, 10, 10, 0, 0, DateTimeKind.Utc);
        var distribution = await TestData.CreateDistributionAsync(_client, family.Id!.Value, food.Id!.Value, date);

        var calendarEvent = await FindDistributionEventAsync(distribution.Id!.Value, date);
        AssertSameInstant(date, calendarEvent.Start);

        // Move the distribution: its calendar event follows
        var newDate = new DateTime(2031, 9, 12, 15, 0, 0, DateTimeKind.Utc);
        var put = await _client.PutAsJsonAsync($"/api/distribution/{distribution.Id}",
            TestData.SingleFamilyDistribution(family.Id!.Value, food.Id!.Value, 1) with { Id = distribution.Id, DistributionDate = newDate });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var moved = await FindDistributionEventAsync(distribution.Id!.Value, newDate);
        Assert.Equal(calendarEvent.Id, moved.Id);

        // Distribution events are read-only from the calendar
        var putEvent = await _client.PutAsJsonAsync($"/api/event/{moved.Id}", new Event { Title = "X", Start = newDate });
        Assert.Equal(HttpStatusCode.Conflict, putEvent.StatusCode);
        var deleteEvent = await _client.DeleteAsync($"/api/event/{moved.Id}");
        Assert.Equal(HttpStatusCode.Conflict, deleteEvent.StatusCode);

        // Deleting the distribution removes its calendar event
        var deleteDistribution = await _client.DeleteAsync($"/api/distribution/{distribution.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteDistribution.StatusCode);
        var gone = await _client.GetAsync($"/api/event/{moved.Id}");
        Assert.Equal(HttpStatusCode.NotFound, gone.StatusCode);
    }

    // Looks up the calendar event mirroring a distribution on its day
    private async Task<Event> FindDistributionEventAsync(int distributionId, DateTime day)
    {
        var events = await _client.GetFromJsonAsync<List<Event>>(Range(day.AddHours(-12), day.AddHours(12)));
        return events!.Single(e => e.DistributionId == distributionId);
    }
}
