using Eden.Api.Models;

namespace Eden.Api.Tests;

// Pure calculation, no database or host needed.
public class FamilyNeedLevelTests
{
    [Theory]
    [InlineData(4500, 2, 4, Family.AssistanceLevel.High)]      // documented CASE 1
    [InlineData(4500, 0, 4, Family.AssistanceLevel.Medium)]    // documented CASE 2
    [InlineData(9000, 2, 4, Family.AssistanceLevel.Medium)]    // documented CASE 3
    [InlineData(9000, 4, 6, Family.AssistanceLevel.High)]      // documented CASE 4
    [InlineData(0, 6, 6, Family.AssistanceLevel.VeryHigh)]     // score 0.92
    [InlineData(10040, 0, 1, Family.AssistanceLevel.VeryLow)]  // score 0.02
    [InlineData(4500, 0, 0, Family.AssistanceLevel.VeryLow)]   // no members: stable by definition
    public void CalculateNeedLevel_ReturnsExpectedLevel(int isee, int children, int members, Family.AssistanceLevel expected)
    {
        Assert.Equal(expected, Family.CalculateNeedLevel(isee, (uint)children, (uint)members));
    }
}
