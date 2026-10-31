import { AssistanceLevel, Family } from '../../../core/models/family';
import { Distribution, DistributionFamily } from '../../../core/models/distribution';
import { filterDistributions, sortDistributions } from './utils';

// Built from local dates so the tests do not depend on the machine timezone
// The API sends an ISO string, so the tests pass one too
const at = (y: number, m: number, d: number, h = 10): Date =>
  new Date(y, m - 1, d, h).toISOString() as unknown as Date;

const family = (name: string): Family => ({
  name,
  members: 1,
  children: 0,
  isee: 0,
  isOccasional: false,
  necessityLevel: AssistanceLevel.Low,
});

const familyItem = (familyId: number, name?: string): DistributionFamily => ({
  familyId,
  family: name === undefined ? undefined : family(name),
  distributionItems: [],
});

const distribution = (id: number, date: Date, ...items: DistributionFamily[]): Distribution => ({
  id,
  distributionDate: date,
  items,
});

const NO_FILTER = { search: '', from: null, to: null };

const list = [
  distribution(1, at(2026, 10, 1), familyItem(1, 'Rossi')),
  distribution(2, at(2026, 10, 15), familyItem(2, 'Bianchi')),
  distribution(3, at(2026, 10, 24), familyItem(3, 'Verdi'), familyItem(4)),
];

describe('filterDistributions', () => {
  it('keeps distributions on or after from', () => {
    const result = filterDistributions(list, { ...NO_FILTER, from: '2026-10-15' });
    expect(result.map((d) => d.id)).toEqual([2, 3]);
  });

  it('keeps distributions on or before to', () => {
    const result = filterDistributions(list, { ...NO_FILTER, to: '2026-10-15' });
    expect(result.map((d) => d.id)).toEqual([1, 2]);
  });

  it('applies both bounds inclusively', () => {
    const result = filterDistributions(list, { ...NO_FILTER, from: '2026-10-15', to: '2026-10-24' });
    expect(result.map((d) => d.id)).toEqual([2, 3]);
  });

  it('matches family name case-insensitively', () => {
    const result = filterDistributions(list, { ...NO_FILTER, search: '  ROSSI ' });
    expect(result.map((d) => d.id)).toEqual([1]);
  });

  it('excludes distributions with no matching family', () => {
    expect(filterDistributions(list, { ...NO_FILTER, search: 'neri' })).toEqual([]);
  });

  it('ignores items without a family', () => {
    const result = filterDistributions(list, { ...NO_FILTER, search: 'verdi' });
    expect(result.map((d) => d.id)).toEqual([3]);
  });

  it('returns everything when no filter is set', () => {
    expect(filterDistributions(list, NO_FILTER).length).toBe(3);
  });
});

describe('sortDistributions', () => {
  it('sorts newest first for desc', () => {
    expect(sortDistributions(list, 'desc').map((d) => d.id)).toEqual([3, 2, 1]);
  });

  it('sorts oldest first for asc', () => {
    expect(sortDistributions(list, 'asc').map((d) => d.id)).toEqual([1, 2, 3]);
  });

  it('does not mutate the input', () => {
    const input = [...list];
    sortDistributions(input, 'asc');
    expect(input.map((d) => d.id)).toEqual([1, 2, 3]);
  });
});
