import { DateTime } from 'luxon';
import { Distribution, DistributionFamily } from '../../../core/models/distribution';
import { Food } from '../../../core/models/food';

// Browser-only: call from event handlers, never at module load (SSR)
export function saveFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function sheetsFileName(distributionDate: Date | string): string {
  return `schede-distribuzione-${DateTime.fromJSDate(new Date(distributionDate)).toFormat('yyyy-MM-dd')}.xlsx`;
}

// Same food rows on every sheet, sorted by name (matches the Excel export)
export function sheetFoods(distribution: Distribution): Food[] {
  const foods = new Map<number, Food>();
  for (const family of distribution.items) {
    for (const item of family.distributionItems) {
      if (item.food && !foods.has(item.foodId)) {
        foods.set(item.foodId, item.food);
      }
    }
  }
  return [...foods.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function sheetQuantity(family: DistributionFamily, foodId: number): number {
  return family.distributionItems
    .filter((item) => item.foodId === foodId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

// Sheet order: by family code (id), sheets show no family name (matches the Excel export)
export function sheetFamilies(distribution: Distribution): DistributionFamily[] {
  return [...distribution.items].sort((left, right) => left.familyId - right.familyId);
}
