using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ClosedXML.Excel;
using Eden.Api.DTOs;
using Eden.Api.Models;
using Eden.Api.Tests.Fixtures;
using Eden.Api.Tests.Helpers;

namespace Eden.Api.Tests;

[Collection("api")]
public class SettingsTests(EdenApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    // Valid 1x1 PNG
    private static readonly byte[] Png = Convert.FromBase64String(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");

    private static MultipartFormDataContent LogoForm(byte[] bytes, string contentType = "image/png")
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { file, "file", "logo.png" } };
    }

    [Fact]
    public async Task Get_Settings_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/settings");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var settings = await response.Content.ReadFromJsonAsync<AssociationSettings>();
        Assert.NotNull(settings);
    }

    [Fact]
    public async Task Put_Settings_ThenGet_ReturnsSaved()
    {
        var name = TestData.UniqueName("Assoc");

        var put = await _client.PutAsJsonAsync("/api/settings", new AssociationSettings { Name = name, Phone = "123" });
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var saved = await _client.GetFromJsonAsync<AssociationSettings>("/api/settings");
        Assert.Equal(name, saved!.Name);
        Assert.Equal("123", saved.Phone);
    }

    [Fact]
    public async Task Put_Settings_EmptyName_ReturnsBadRequest()
    {
        var response = await _client.PutAsJsonAsync("/api/settings", new AssociationSettings { Name = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_Logo_Png_ThenGet_ReturnsImage()
    {
        var upload = await _client.PutAsync("/api/settings/logo", LogoForm(Png));
        Assert.Equal(HttpStatusCode.OK, upload.StatusCode);

        var logo = await _client.GetAsync("/api/settings/logo");
        Assert.Equal(HttpStatusCode.OK, logo.StatusCode);
        Assert.Equal("image/png", logo.Content.Headers.ContentType!.MediaType);
        Assert.Equal(Png, await logo.Content.ReadAsByteArrayAsync());

        // HasLogo is computed and get-only, so read it from the JSON rather than the entity
        var json = await _client.GetFromJsonAsync<JsonElement>("/api/settings");
        Assert.True(json.GetProperty("hasLogo").GetBoolean());
    }

    [Fact]
    public async Task Put_Logo_InvalidType_ReturnsBadRequest()
    {
        // Claims image/png but the bytes are text: the header must not be trusted
        var response = await _client.PutAsync("/api/settings/logo", LogoForm("hello"u8.ToArray(), "image/png"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_Logo_TooLarge_ReturnsBadRequest()
    {
        var bytes = new byte[1024 * 1024 + 1];
        Png.CopyTo(bytes, 0);

        var response = await _client.PutAsync("/api/settings/logo", LogoForm(bytes));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Delete_Logo_ThenGet_ReturnsNotFound()
    {
        await _client.PutAsync("/api/settings/logo", LogoForm(Png));

        var delete = await _client.DeleteAsync("/api/settings/logo");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var logo = await _client.GetAsync("/api/settings/logo");
        Assert.Equal(HttpStatusCode.NotFound, logo.StatusCode);
    }

    [Fact]
    public async Task GetSheets_WithLogo_UsesAssociationLogo()
    {
        await _client.PutAsJsonAsync("/api/settings", new AssociationSettings { Name = TestData.UniqueName("Assoc") });
        await _client.PutAsync("/api/settings/logo", LogoForm(Png));
        var food = await TestData.CreateFoodAsync(_client, quantity: 10);
        var family = await TestData.CreateFamilyAsync(_client);
        var created = await _client.PostAsJsonAsync("/api/distribution", TestData.SingleFamilyDistribution(family.Id!.Value, food.Id!.Value, 2));
        var distribution = (await created.Content.ReadFromJsonAsync<DistributionDto>())!;

        var response = await _client.GetAsync($"/api/distribution/{distribution.Id}/sheets");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        using (var zip = new System.IO.Compression.ZipArchive(new MemoryStream(bytes)))
        {
            // Deduplicated: exactly one embedded image, and it is the association logo
            var media = Assert.Single(zip.Entries, e => e.FullName.StartsWith("xl/media/"));
            using var entry = media.Open();
            using var copy = new MemoryStream();
            await entry.CopyToAsync(copy);
            Assert.Equal(Png, copy.ToArray());
        }
        using var workbook = new XLWorkbook(new MemoryStream(bytes));
        Assert.Single(workbook.Worksheet(1).Pictures);
    }

    [Fact]
    public async Task GetSheets_WithLogo_StoresLogoOnce()
    {
        await _client.PutAsJsonAsync("/api/settings", new AssociationSettings { Name = TestData.UniqueName("Assoc") });
        await _client.PutAsync("/api/settings/logo", LogoForm(Png));
        var food = await TestData.CreateFoodAsync(_client, quantity: 10);
        var families = new List<Family>();
        for (var i = 0; i < 3; i++) families.Add(await TestData.CreateFamilyAsync(_client));
        var distributionDto = new DistributionDto
        {
            Items = families.Select(f => new DistributionFamilyDto
            {
                FamilyId = f.Id!.Value,
                DistributionItems = [new DistributionItemDto { FoodId = food.Id!.Value, Quantity = 1 }]
            }).ToList()
        };
        var created = await _client.PostAsJsonAsync("/api/distribution", distributionDto);
        var distribution = (await created.Content.ReadFromJsonAsync<DistributionDto>())!;

        var response = await _client.GetAsync($"/api/distribution/{distribution.Id}/sheets");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        using (var zip = new System.IO.Compression.ZipArchive(new MemoryStream(bytes)))
        {
            Assert.Single(zip.Entries, e => e.FullName.StartsWith("xl/media/"));
        }
        using var workbook = new XLWorkbook(new MemoryStream(bytes));
        Assert.Equal(3, workbook.Worksheet(1).Pictures.Count);
    }
}
