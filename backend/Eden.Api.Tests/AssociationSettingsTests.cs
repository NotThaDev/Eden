using Eden.Api.Models;

namespace Eden.Api.Tests;

public class AssociationSettingsTests
{
    [Theory]
    [InlineData(null, "", "Scheda distribuzione")]
    [InlineData(null, "Banco Eden", "Banco Eden")]
    [InlineData("  ", "Banco Eden", "Banco Eden")]
    [InlineData("Scheda Eden", "Banco Eden", "Scheda Eden")]
    public void EffectiveSheetTitle_FallsBack(string? sheetTitle, string name, string expected)
    {
        Assert.Equal(expected, new AssociationSettings { SheetTitle = sheetTitle, Name = name }.EffectiveSheetTitle);
    }
}
