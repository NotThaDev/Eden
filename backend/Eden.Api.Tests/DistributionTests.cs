using System.Net;
using System.Net.Http.Json;
using ClosedXML.Excel;
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

    [Fact]
    public async Task Sheets_ShowCodeLogoTenRowsAndOnlyBeneficiarySignature()
    {
        var food = await TestData.CreateFoodAsync(_client, quantity: 10);
        var family = await TestData.CreateFamilyAsync(_client);
        var distribution = await TestData.CreateDistributionAsync(_client, family.Id!.Value, food.Id!.Value, DateTime.UtcNow);

        var response = await _client.GetAsync($"/api/distribution/{distribution.Id}/sheets");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        using (var zip = new System.IO.Compression.ZipArchive(new MemoryStream(bytes)))
        {
            // The app logo is embedded once even though every sheet shows it
            Assert.Single(zip.Entries, e => e.FullName.StartsWith("xl/media/"));
        }
        using var workbook = new XLWorkbook(new MemoryStream(bytes));
        var ws = workbook.Worksheet("Schede");
        var texts = ws.CellsUsed().Select(c => c.GetString()).ToList();

        Assert.Equal($"Codice: {family.Id}", ws.Cell(1, 3).GetString());
        Assert.Equal("Distribuzione Alimentare", ws.Cell(4, 1).GetString());
        Assert.StartsWith("Data: ", ws.Cell(4, 3).GetString());
        Assert.DoesNotContain(texts, t => t.Contains(family.Name));
        Assert.Contains("Firma beneficiario", texts);
        Assert.DoesNotContain("Firma operatore", texts);
        Assert.DoesNotContain("Note", texts);
        Assert.Single(ws.Pictures);

        // 1 food, yet the table has 10 bordered rows below the header
        var headerRow = ws.CellsUsed().First(c => c.GetString() == "Alimento").Address.RowNumber;
        Assert.Equal(food.Name, ws.Cell(headerRow + 1, 1).GetString());
        Assert.Equal(XLBorderStyleValues.Thin, ws.Cell(headerRow + 10, 1).Style.Border.BottomBorder);
        Assert.Equal(string.Empty, ws.Cell(headerRow + 10, 1).GetString());
    }

    [Fact]
    public void Sheets_FullPageOrderedByCodeFitsPrintArea()
    {
        // 14 foods: block = 14 + 10 = 24 rows, page = 2 * 24 + 2 = 50 rows
        var foods = Enumerable.Range(1, 14)
            .Select(i => new Eden.Api.Models.Food { Id = i, Name = $"Cibo {i:00}", UnitSize = 1, Unit = "kg" })
            .ToList();
        var distribution = new Eden.Api.Models.Distribution
        {
            DistributionDate = DateTime.UtcNow,
            // family ids inserted out of order on purpose
            Items = new[] { 4, 2, 3, 1 }
                .Select(id => new Eden.Api.Models.DistributionItem { FamilyId = id, FoodId = 1, Food = foods[0], Quantity = 1 })
                .Concat(foods.Skip(1).Select(f => new Eden.Api.Models.DistributionItem { FamilyId = 1, FoodId = f.Id, Food = f, Quantity = 1 }))
                .ToList(),
        };

        using var workbook = new XLWorkbook(new MemoryStream(Eden.Api.Helpers.DistributionSheetsExcel.Build(distribution)));
        var ws = workbook.Worksheet("Schede");

        // 2x2, ordered by code: top-left 1, top-right 2, bottom-left 3, bottom-right 4 (bottom blocks start at 1 + 24 + 2 = 27)
        Assert.Equal("Codice: 1", ws.Cell(1, 3).GetString());
        Assert.Equal("Codice: 2", ws.Cell(1, 7).GetString());
        Assert.Equal("Codice: 3", ws.Cell(27, 3).GetString());
        Assert.Equal("Codice: 4", ws.Cell(27, 7).GetString());

        // one logo per sheet, anchored at the sheet's top-left cell
        Assert.Equal(
            new[] { "A1", "A27", "E1", "E27" },
            ws.Pictures.Select(p => p.TopLeftCell.Address.ToString()).OrderBy(a => a).ToArray());

        // bottom-right signature is the page's last row and is inside the print area; scale stays 100
        Assert.Equal("Firma beneficiario", ws.Cell(50, 6).GetString());
        Assert.Equal(50, ws.PageSetup.PrintAreas.Single().RangeAddress.LastAddress.RowNumber);
        Assert.Equal(100, ws.PageSetup.Scale);
    }
}
