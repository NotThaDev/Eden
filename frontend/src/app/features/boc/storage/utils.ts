import { Food } from '../../../core/models/food';

export const LOW_STOCK_THRESHOLD = 10;

export interface FoodFilter {
  search: string;
  lowStock: boolean;
}

export function matchesFoodFilter(food: Food, filter: FoodFilter): boolean {
  const search = filter.search.trim().toLowerCase();
  const matchesSearch = (food.name ?? '').toLowerCase().includes(search);
  const matchesStock = !filter.lowStock || food.quantity <= LOW_STOCK_THRESHOLD;

  return matchesSearch && matchesStock;
}

export function foodSortValue(food: Food, column: string): string | number {
  switch (column) {
    case 'name':
      return (food.name ?? '').toLowerCase();
    case 'quantity':
      return food.quantity;
    case 'unit':
      // Sorts by unit name only, not by unitSize (intended).
      return (food.unit ?? '').toLowerCase();
    default:
      return '';
  }
}
