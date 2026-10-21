# Distributions

A distribution hands out food from storage to families. Creating one removes the distributed quantities from food stock; deleting it gives them back.

## Creating a distribution

"Nuova Distribuzione" on the Distribuzioni page opens a four-step dialog. The steps are listed in a rail on the left (on top on phones):

1. **Data e famiglie**: pick the distribution date (default today, past dates disabled) and the families to include (at least one; "Seleziona tutte" selects every family).
2. **Alimenti**: pick the foods to distribute (at least one; only foods in stock are listed; "Seleziona tutti" selects every food).
3. **Riepilogo**: the app calls `POST api/distribution/preview` with the selected ids and shows the date, the number of families and the computed allocation per family with a total per food, read-only.
4. **Genera schede**: a carousel previews the printable sheet of each family (one at a time, ordered by family code). "Crea e scarica schede" saves the distribution with `POST api/distribution` and the chosen date, then downloads its sheets (see below).

The preview is not saved. If stock changes between preview and save, the create request fails validation and the page shows an error.

## Sheets ("schede")

Operators print one sheet per family and use it while handing out the food. Sheets are derived from the distribution; nothing extra is stored.

- `GET api/distribution/{id}/sheets` returns `schede-distribuzione-yyyy-MM-dd.xlsx`, built by `DistributionSheetsExcel` (backend helper, ClosedXML).
- "Esporta schede" in each distribution's accordion downloads the same file at any time.
- Each sheet: the logo top-left (the association logo from Impostazioni → Schede when uploaded, otherwise the Eden logo), the date, the family code top-right ("Codice", the family id for now), a table with every food of the distribution (name, unit size, quantity for that family, 0 if none) padded to at least 10 rows, and one signature line ("Firma beneficiario") bottom-right. No family name: sheets are anonymous.
- Layout: one worksheet, A4 portrait, 4 sheets per page in a 2×2 grid, families ordered by code (id). Every sheet has the same height (all foods are listed, at least 10 table rows), so the page height is known: the helper inserts a manual page break after each page and sets a fixed print scale that fits one page. It does not use "fit to page", because Excel ignores manual page breaks with it.

## Allocation rule

`Distribution.BuildDistributionFromFamilies` (backend) splits each food as follows:

- Each necessity level gets a share of the food equal to its share of the selected families.
- Within a level, the share is split equally between its families. The remainder goes one unit at a time to families with more children, then more members.
- Integer rounding can leave some units undistributed; they stay in stock.

## Stock consistency

Create, update and delete save the distribution and the food quantity changes in one transaction (PR #52).
