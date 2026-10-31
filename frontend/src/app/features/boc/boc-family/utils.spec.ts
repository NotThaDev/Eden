import { AssistanceLevel, Family } from '../../../core/models/family';
import { EMPTY_FAMILY_FILTER, filterFamilies, sortFamilies } from './utils';

const families: Family[] = [
  { id: 1, name: 'Rossi', members: 4, children: 2, isee: 5000, isOccasional: false, necessityLevel: AssistanceLevel.High },
  { id: 2, name: 'bianchi', members: 1, children: 0, isee: 12000, isOccasional: false, necessityLevel: AssistanceLevel.VeryLow },
  { id: 3, name: 'Verdi', members: 3, children: 1, isee: 8000, isOccasional: true, necessityLevel: AssistanceLevel.Medium },
];

describe('filterFamilies', () => {
  it('matches name case-insensitively and trims the search', () => {
    expect(filterFamilies(families, { ...EMPTY_FAMILY_FILTER, search: '  ROSSI ' })).toEqual([families[0]]);
    expect(filterFamilies(families, { ...EMPTY_FAMILY_FILTER, search: 'BIA' })).toEqual([families[1]]);
  });

  it('filters by necessity levels when set', () => {
    expect(filterFamilies(families, { ...EMPTY_FAMILY_FILTER, levels: [AssistanceLevel.Medium] })).toEqual([families[2]]);
    expect(
      filterFamilies(families, { ...EMPTY_FAMILY_FILTER, levels: [AssistanceLevel.High, AssistanceLevel.Medium] }),
    ).toEqual([families[0], families[2]]);
    expect(filterFamilies(families, EMPTY_FAMILY_FILTER)).toEqual(families);
  });
});

describe('sortFamilies', () => {
  it('sorts names ascending and descending', () => {
    expect(sortFamilies(families, { active: 'name', direction: 'asc' }).map((f) => f.name)).toEqual([
      'bianchi',
      'Rossi',
      'Verdi',
    ]);
    expect(sortFamilies(families, { active: 'name', direction: 'desc' }).map((f) => f.name)).toEqual([
      'Verdi',
      'Rossi',
      'bianchi',
    ]);
  });

  it('sorts necessity level by enum order, not alphabetically', () => {
    expect(sortFamilies(families, { active: 'necessityLevel', direction: 'asc' }).map((f) => f.id)).toEqual([2, 3, 1]);
  });

  it('keeps order and does not mutate input when direction is empty', () => {
    const copy = [...families];
    const result = sortFamilies(families, { active: 'name', direction: '' });
    expect(result).toEqual(copy);
    expect(families).toEqual(copy);
  });

  it('does not mutate input when sorting', () => {
    const copy = [...families];
    sortFamilies(families, { active: 'isee', direction: 'desc' });
    expect(families).toEqual(copy);
  });
});
