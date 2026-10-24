using System.IO.Compression;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using ClosedXML.Excel.Drawings;
using Eden.Api.Models;

namespace Eden.Api.Helpers
{
    public static class DistributionSheetsExcel
    {
        private const double RowHeight = 15;
        private const int MinFoodRows = 10;
        private const int LogoPx = 56; // ~3 rows of 15pt (45pt = 60px)

        private static readonly Lazy<byte[]> AppLogo = new(() =>
        {
            using var stream = typeof(DistributionSheetsExcel).Assembly.GetManifestResourceStream("Eden.Api.assets.app-logo.png")!;
            using var copy = new MemoryStream();
            stream.CopyTo(copy);
            return copy.ToArray();
        });

        // logo: seam for the association logo (PR #67); defaults to the app logo
        public static byte[] Build(Distribution distribution, byte[]? logo = null)
        {
            logo ??= AppLogo.Value;

            // Sheets carry no family name anymore, so they are ordered by family code (id)
            var families = distribution.Items
                .GroupBy(i => i.FamilyId)
                .OrderBy(g => g.Key)
                .Select(g => (FamilyId: g.Key, Items: g.ToList()))
                .ToList();

            var foods = distribution.Items
                .GroupBy(i => i.FoodId)
                .Select(g => g.First().Food)
                .Where(f => f != null)
                .OrderBy(f => f!.Name)
                .ToList();

            // 3 logo rows + date + blank + header + n food rows + 2 blank + signature line + label = n + 10,
            // n = max(10, foods): the table always has at least 10 rows, more foods grow the block
            var tableRows = Math.Max(MinFoodRows, foods.Count);
            var blockHeight = tableRows + 10;
            var pageRows = 2 * blockHeight + 2; // block + 2 gap rows + block; the page break follows the second block
            var date = $"Data: {distribution.DistributionDate.ToLocalTime():dd/MM/yyyy}";

            using var workbook = new XLWorkbook();
            var ws = workbook.AddWorksheet("Schede");
            ws.ColumnWidth = 10;
            ws.Column("A").Width = 24;
            ws.Column("B").Width = 11;
            ws.Column("C").Width = 10;
            ws.Column("D").Width = 3;
            ws.Column("E").Width = 24;
            ws.Column("F").Width = 11;
            ws.Column("G").Width = 10;

            var pageCount = Math.Max(1, (families.Count + 3) / 4);
            var lastRow = pageCount * pageRows;
            ws.Rows(1, lastRow).Height = RowHeight;

            for (var i = 0; i < families.Count; i++)
            {
                var top = 1 + (i / 4) * pageRows + ((i % 4) / 2) * (blockHeight + 2);
                var col = i % 2 == 0 ? 1 : 5;
                WriteBlock(ws, top, col, families[i].FamilyId, families[i].Items, foods!, tableRows, date, logo);
            }

            // Fixed scale instead of FitToPages: Excel ignores manual page breaks with FitToPages.
            // All rows are RowHeight high, so one printed page is pageRows rows.
            var pageHeightPt = RowHeight * pageRows;
            var availableHeight = 842 - 2 * 0.4 * 72;
            var availableWidth = 595 - 2 * 0.4 * 72;
            var widthPt = (24 + 11 + 10 + 3 + 24 + 11 + 10) * 5.6;
            var scale = (int)Math.Min(100, Math.Floor(availableHeight / pageHeightPt * 100 * 0.97));
            scale = (int)Math.Min(scale, Math.Floor(availableWidth / widthPt * 100));

            var setup = ws.PageSetup;
            setup.PaperSize = XLPaperSize.A4Paper;
            setup.PageOrientation = XLPageOrientation.Portrait;
            setup.Margins.Top = setup.Margins.Bottom = setup.Margins.Left = setup.Margins.Right = 0.4;
            setup.Margins.Header = setup.Margins.Footer = 0;
            setup.CenterHorizontally = true;
            setup.Scale = scale;
            setup.PrintAreas.Clear();
            setup.PrintAreas.Add($"A1:G{lastRow}");
            for (var p = 1; p < pageCount; p++)
            {
                setup.AddHorizontalPageBreak(p * pageRows);
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return DeduplicateMedia(stream.ToArray());
        }

        // ClosedXML embeds a separate copy of the image for every AddPicture call; point all pictures at one copy.
        // Assumes the logo is the only media in the workbook (the sheets have no other images).
        private static byte[] DeduplicateMedia(byte[] xlsx)
        {
            using var ms = new MemoryStream();
            ms.Write(xlsx);
            using (var zip = new ZipArchive(ms, ZipArchiveMode.Update, leaveOpen: true))
            {
                var media = zip.Entries.Where(e => e.FullName.StartsWith("xl/media/")).OrderBy(e => e.FullName.Length).ThenBy(e => e.FullName).ToList();
                if (media.Count < 2) return xlsx;
                var keep = "/" + media[0].FullName;
                foreach (var rels in zip.Entries.Where(e => e.FullName.StartsWith("xl/drawings/_rels/")).ToList())
                {
                    string xml;
                    using (var reader = new StreamReader(rels.Open())) xml = reader.ReadToEnd();
                    xml = Regex.Replace(xml, "Target=\"/?xl/media/[^\"]+\"", $"Target=\"{keep}\"");
                    rels.Delete();
                    using var writer = new StreamWriter(zip.CreateEntry(rels.FullName).Open());
                    writer.Write(xml);
                }
                foreach (var dup in media.Skip(1)) dup.Delete();
            }
            return ms.ToArray();
        }

        private static void WriteBlock(IXLWorksheet ws, int top, int col, int? familyId,
            List<DistributionItem> items, List<Food?> foods, int tableRows, string date, byte[] logo)
        {
            var r = top;
            var right = col + 2;

            // Rows top..top+2: logo and title on the left, family code on the right
            var pic = ws.AddPicture(new MemoryStream(logo));
            pic.Placement = XLPicturePlacement.Move; // must be set before sizing
            // Keep the aspect ratio: at most LogoPx high and 2.5 * LogoPx wide (column A is ~170 px)
            pic.MoveTo(ws.Cell(r, col)).Scale(Math.Min((double)LogoPx / pic.OriginalHeight, 2.5 * LogoPx / pic.OriginalWidth));
            // Indent pushes the title past the logo (one level is ~21 px); the text overflows into the empty cell on its right
            var title = ws.Cell(r + 1, col);
            title.Value = "Distribuzione Alimentare";
            title.Style.Font.Bold = true;
            title.Style.Alignment.Indent = (int)Math.Ceiling((pic.Width + 6) / 21.0);
            // shortcut: the family code is the DB id until families get a proper code, then show that instead
            var code = ws.Cell(r, right);
            code.Value = $"Codice: {familyId}";
            code.Style.Font.Bold = true;
            code.Style.Font.FontSize = 12;
            code.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            r += 3;

            ws.Cell(r++, col).Value = date;
            r++;

            var header = ws.Range(r, col, r, right);
            ws.Cell(r, col).Value = "Alimento";
            ws.Cell(r, col + 1).Value = "Formato";
            ws.Cell(r, col + 2).Value = "Quantità";
            header.Style.Font.Bold = true;
            header.Style.Fill.BackgroundColor = XLColor.LightGray;
            header.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            header.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            r++;

            var firstFood = r;
            foreach (var food in foods)
            {
                var qty = items.Where(i => i.FoodId == food!.Id).Sum(i => i.Quantity);
                ws.Cell(r, col).Value = food!.Name;
                ws.Cell(r, col + 1).Value = $"{food.UnitSize:0.##} {food.Unit}".Trim();
                ws.Cell(r, col + 2).Value = qty;
                ws.Cell(r, col + 2).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                r++;
            }
            // Pad to tableRows with empty bordered rows
            r = firstFood + tableRows;
            var body = ws.Range(firstFood, col, r - 1, right);
            body.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            body.Style.Border.InsideBorder = XLBorderStyleValues.Thin;

            r += 2;
            ws.Range(r, col + 1, r, right).Style.Border.BottomBorder = XLBorderStyleValues.Thin;
            r++;
            var label = ws.Range(r, col + 1, r, right).Merge();
            label.Value = "Firma beneficiario";
            label.Style.Font.FontSize = 8;
            label.Style.Font.Italic = true;
            label.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
        }
    }
}
