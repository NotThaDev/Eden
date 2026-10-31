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

export interface DistributionFilter {
  search: string;
  from: string | null; // 'yyyy-MM-dd', inclusive
  to: string | null; // 'yyyy-MM-dd', inclusive
}

export type DateSortDirection = 'desc' | 'asc';

const pad2 = (n: number): string => String(n).padStart(2, '0');

// Local calendar day ('yyyy-MM-dd') of a distribution; the API sends UTC ('Z') timestamps
function distributionDay(distributionDate: Date | string): string {
  const date = new Date(distributionDate);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function filterDistributions(list: Distribution[], filter: DistributionFilter): Distribution[] {
  const search = filter.search.trim().toLowerCase();
  return list.filter((distribution) => {
    const day = distributionDay(distribution.distributionDate);
    if (filter.from && day < filter.from) {
      return false;
    }
    if (filter.to && day > filter.to) {
      return false;
    }
    if (!search) {
      return true;
    }
    return distribution.items.some((item) =>
      (item.family?.name ?? '').toLowerCase().includes(search),
    );
  });
}

export function sortDistributions(list: Distribution[], direction: DateSortDirection): Distribution[] {
  const sign = direction === 'desc' ? -1 : 1;
  return [...list].sort(
    (left, right) =>
      sign *
      (new Date(left.distributionDate).getTime() - new Date(right.distributionDate).getTime()),
  );
}
