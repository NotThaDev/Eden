using Eden.Api.DTOs;
using Eden.Api.Models;

namespace Eden.Api.Tests;

// Pure calculation, no database or host needed.
public class FamilySkippedStreakTests
{
    private static readonly DateTime Today = new(2026, 10, 19, 0, 0, 0, DateTimeKind.Utc);

    // daysAgo > 0 = past, 0 = today, < 0 = future
    private static FamilyDistributionDto Row(int daysAgo, bool? present) =>
        new() { DistributionDate = Today.AddDays(-daysAgo).AddHours(10), Present = present };

    private static int Streak(params FamilyDistributionDto[] rows) => Family.CountSkippedStreak(rows, Today);

    [Fact]
    public void NoHistory_Returns0()
    {
        Assert.Equal(0, Streak());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(2)]
    [InlineData(4)]
    [InlineData(6)]
    public void ConsecutiveAbsences_ReturnCount(int skipped)
    {
        var rows = Enumerable.Range(1, skipped).Select(d => Row(d, false)).ToList();
        rows.Add(Row(skipped + 1, true));

        Assert.Equal(skipped, Streak(rows.ToArray()));
    }

    [Fact]
    public void Present_BreaksStreak()
    {
        Assert.Equal(2, Streak(Row(1, false), Row(2, false), Row(3, true), Row(4, false), Row(5, false)));
    }

    [Fact]
    public void NewestPresent_Returns0()
    {
        Assert.Equal(0, Streak(Row(1, true), Row(2, false), Row(3, false)));
    }

    [Fact]
    public void NotRecorded_IsSkippedOver()
    {
        Assert.Equal(2, Streak(Row(1, false), Row(2, null), Row(3, false), Row(4, true)));
    }

    [Fact]
    public void OnlyNotRecorded_Returns0()
    {
        Assert.Equal(0, Streak(Row(1, null), Row(2, null)));
    }

    [Fact]
    public void FutureAndToday_AreExcluded()
    {
        Assert.Equal(0, Streak(Row(-7, false), Row(0, false), Row(1, true)));
    }

    [Fact]
    public void UnorderedInput_IsSortedByDate()
    {
        Assert.Equal(2, Streak(Row(3, true), Row(1, false), Row(2, false)));
    }
}
