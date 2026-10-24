import { Sort } from '@angular/material/sort';
import { AssistanceLevel, Family } from '../../../core/models/family';

export interface NecessityLevelChipProps {
  label: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
}

export type FamilyTypeFilter = 'all' | 'regular' | 'occasional';

export interface FamilyFilter {
  search: string;
  level: AssistanceLevel | '';
  type: FamilyTypeFilter;
  iseeMin: number | null;
  iseeMax: number | null;
}

export const EMPTY_FAMILY_FILTER: FamilyFilter = {
  search: '',
  level: '',
  type: 'all',
  iseeMin: null,
  iseeMax: null,
};

const LEVEL_ORDER: AssistanceLevel[] = [
  AssistanceLevel.VeryLow,
  AssistanceLevel.Low,
  AssistanceLevel.Medium,
  AssistanceLevel.High,
  AssistanceLevel.VeryHigh,
];

// type is handled by section visibility, not here
export function filterFamilies(families: Family[], f: FamilyFilter): Family[] {
  const search = f.search.trim().toLowerCase();
  return families.filter(
    (family) =>
      (!search || family.name.toLowerCase().includes(search)) &&
      (!f.level || family.necessityLevel === f.level) &&
      (f.iseeMin != null ? family.isee >= f.iseeMin : true) &&
      (f.iseeMax != null ? family.isee <= f.iseeMax : true),
  );
}

export function sortFamilies(families: Family[], sort: Sort): Family[] {
  if (!sort.direction) return families;
  const dir = sort.direction === 'asc' ? 1 : -1;
  const compare = (a: Family, b: Family): number => {
    switch (sort.active) {
      case 'name':
        return a.name.localeCompare(b.name, 'it');
      case 'members':
        return a.members - b.members;
      case 'children':
        return a.children - b.children;
      case 'isee':
        return a.isee - b.isee;
      case 'necessityLevel':
        return LEVEL_ORDER.indexOf(a.necessityLevel) - LEVEL_ORDER.indexOf(b.necessityLevel);
      default:
        return 0;
    }
  };
  return [...families].sort((a, b) => dir * compare(a, b));
}
