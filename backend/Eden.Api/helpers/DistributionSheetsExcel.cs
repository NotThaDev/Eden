using ClosedXML.Excel;
using Eden.Api.Models;

namespace Eden.Api.Helpers
{
    public static class DistributionSheetsExcel
    {
        private const double RowHeight = 15;
        private const double NameRowHeight = 20;

        public static byte[] Build(Distribution distribution)
        {
            var families = distribution.Items
                .GroupBy(i => i.FamilyId)
                .Select(g => (Family: g.First().Family, Items: g.ToList()))
                .OrderBy(g => g.Family?.Name ?? string.Empty)
                .ToList();

            var foods = distribution.Items
                .GroupBy(i => i.FoodId)
                .Select(g => g.First().Food)
                .Where(f => f != null)
                .OrderBy(f => f!.Name)
                .ToList();

            // name + date + members + blank + header + n foods + blank + "Note" + 3 notes
            // + 2 blank + line + label + 2 blank + line + label = n + 18
            var blockHeight = foods.Count + 18;
            var pageRows = 2 * blockHeight + 2;
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
            var lastRow = pageCount * pageRows - 2;
            ws.Rows(1, lastRow).Height = RowHeight;

            for (var i = 0; i < families.Count; i++)
            {
                var top = 1 + (i / 4) * pageRows + ((i % 4) / 2) * (blockHeight + 2);
                var col = i % 2 == 0 ? 1 : 5;
                WriteBlock(ws, top, col, families[i].Family, families[i].Items, foods!, date);
            }

            // Fixed scale instead of FitToPages: Excel ignores manual page breaks with FitToPages.
            var pageHeightPt = 2 * (RowHeight * blockHeight + (NameRowHeight - RowHeight)) + 2 * RowHeight;
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
            return stream.ToArray();
        }

        private static void WriteBlock(IXLWorksheet ws, int top, int col, Family? family,
            List<DistributionItem> items, List<Food?> foods, string date)
        {
            var r = top;
            var right = col + 2;

            var name = ws.Range(r, col, r, right).Merge();
            name.Value = family?.Name ?? string.Empty;
            name.Style.Font.Bold = true;
            name.Style.Font.FontSize = 14;
            ws.Row(r).Height = NameRowHeight;
            r++;

            ws.Cell(r++, col).Value = date;
            ws.Cell(r++, col).Value = $"Componenti: {family?.Members ?? 0} (minori: {family?.Children ?? 0})";
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
            if (foods.Count > 0)
            {
                var body = ws.Range(firstFood, col, r - 1, right);
                body.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                body.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            }
            r++;

            ws.Cell(r++, col).Value = "Note";
            ws.Cell(r - 1, col).Style.Font.Bold = true;
            var notes = ws.Range(r, col, r + 2, right).Merge();
            notes.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            r += 3;

            foreach (var label in new[] { "Firma operatore", "Firma beneficiario" })
            {
                r += 2;
                ws.Range(r, col, r, right).Style.Border.BottomBorder = XLBorderStyleValues.Thin;
                r++;
                var cell = ws.Cell(r++, col);
                cell.Value = label;
                cell.Style.Font.FontSize = 8;
                cell.Style.Font.Italic = true;
            }
        }
    }
}
