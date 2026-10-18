# Distributions

A distribution hands out food from storage to families. Creating one removes the distributed quantities from food stock; deleting it gives them back.

## Creating a distribution

"Nuova Distribuzione" on the Distribuzioni page opens a three-step dialog. The steps are listed in a rail on the left (on top on phones):

1. **Data e famiglie**: pick the distribution date (default today, past dates disabled) and the families to include (at least one; "Seleziona tutte" selects every family).
2. **Alimenti**: pick the foods to distribute (at least one; only foods in stock are listed; "Seleziona tutti" selects every food).
3. **Riepilogo**: the app calls `POST api/distribution/preview` with the selected ids and shows the date, the number of families and the computed allocation per family with a total per food, read-only. "Crea" saves it with `POST api/distribution` and the chosen date.

The preview is not saved. If stock changes between preview and save, the create request fails validation and the page shows an error.

## Allocation rule

`Distribution.BuildDistributionFromFamilies` (backend) splits each food as follows:

- Each necessity level gets a share of the food equal to its share of the selected families.
- Within a level, the share is split equally between its families. The remainder goes one unit at a time to families with more children, then more members.
- Integer rounding can leave some units undistributed; they stay in stock.

## Stock consistency

Create, update and delete save the distribution and the food quantity changes in one transaction (PR #52).
