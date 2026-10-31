import { Food } from '../../../core/models/food';
import { foodSortValue, matchesFoodFilter } from './utils';

const food = (overrides: Partial<Food> = {}): Food => ({
  id: 1,
  name: 'Pasta',
  quantity: 5,
  unitSize: 1,
  unit: 'kg',
  ...overrides,
});

describe('storage utils', () => {
  describe('matchesFoodFilter', () => {
    const none = { search: '', lowStock: false };

    it('matches name case-insensitively and ignores surrounding spaces', () => {
      expect(matchesFoodFilter(food({ name: 'Pasta Integrale' }), { search: '  PASTA ', lowStock: false })).toBe(true);
      expect(matchesFoodFilter(food({ name: 'Riso' }), { search: 'pasta', lowStock: false })).toBe(false);
    });

    it('matches everything with an empty search', () => {
      expect(matchesFoodFilter(food(), none)).toBe(true);
    });

    it('treats quantity 10 as low stock and 11 as not low stock', () => {
      const lowStock = { search: '', lowStock: true };
      expect(matchesFoodFilter(food({ quantity: 10 }), lowStock)).toBe(true);
      expect(matchesFoodFilter(food({ quantity: 11 }), lowStock)).toBe(false);
    });

    it('combines search and low stock filters', () => {
      const both = { search: 'pasta', lowStock: true };
      expect(matchesFoodFilter(food({ name: 'Pasta', quantity: 3 }), both)).toBe(true);
      expect(matchesFoodFilter(food({ name: 'Pasta', quantity: 30 }), both)).toBe(false);
      expect(matchesFoodFilter(food({ name: 'Riso', quantity: 3 }), both)).toBe(false);
    });

    it('does not throw when name is null', () => {
      expect(matchesFoodFilter(food({ name: null as unknown as string }), { search: 'a', lowStock: false })).toBe(false);
    });
  });

  describe('foodSortValue', () => {
    it('returns lowercase name for name column', () => {
      expect(foodSortValue(food({ name: 'Pasta' }), 'name')).toBe('pasta');
    });

    it('returns quantity as number for quantity column', () => {
      expect(foodSortValue(food({ quantity: 7 }), 'quantity')).toBe(7);
    });

    it('returns lowercase unit name for unit column (unitSize is ignored)', () => {
      expect(foodSortValue(food({ unit: 'Kg', unitSize: 500 }), 'unit')).toBe('kg');
    });

    it('returns empty string for unknown column', () => {
      expect(foodSortValue(food(), 'actions')).toBe('');
    });

    it('does not throw when name or unit is null', () => {
      expect(foodSortValue(food({ name: null as unknown as string }), 'name')).toBe('');
      expect(foodSortValue(food({ unit: null as unknown as string }), 'unit')).toBe('');
    });
  });
});
