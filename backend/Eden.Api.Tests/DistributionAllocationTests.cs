using Eden.Api.Models;

namespace Eden.Api.Tests;

// Pure allocation logic, no database or host needed.
public class DistributionAllocationTests
{
    [Fact]
    public async Task BuildDistributionFromFamilies_SplitsSameLevelFamiliesWithRemainderToFirst()
    {
        var families = new List<Family>
        {
            new() { Id = 1, Name = "A", Members = 4, Children = 2, Isee = 4500, NecessityLevel = Family.AssistanceLevel.High },
            new() { Id = 2, Name = "B", Members = 4, Children = 2, Isee = 4500, NecessityLevel = Family.AssistanceLevel.High }
        };
        var foods = new List<Food> { new() { Id = 1, Name = "Pasta", Quantity = 5, Unit = "kg", UnitSize = 1 } };

        var distribution = await Distribution.BuildDistributionFromFamilies(families, foods);

        Assert.Equal(3, distribution.Items.Single(i => i.FamilyId == 1).Quantity);
        Assert.Equal(2, distribution.Items.Single(i => i.FamilyId == 2).Quantity);
    }
}
