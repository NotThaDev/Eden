import { AssistanceLevel } from '../../../core/models/family';

export interface NecessityLevelChipProps {
  label: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
}

export function necessityLevelChipProps(level: AssistanceLevel): NecessityLevelChipProps {
  switch (level) {
    case AssistanceLevel.VeryLow:
      return {
        label: 'Molto Basso',
        textColor: 'light-dark(#1B5E20, #A5D6A7)',
        backgroundColor: 'light-dark(#E8F5E9, #12291a)',
        borderColor: '#4CAF50',
      };
    case AssistanceLevel.Low:
      return {
        label: 'Basso',
        textColor: 'light-dark(#F57F17, #FFE082)',
        backgroundColor: 'light-dark(#FFF3E0, #2e2508)',
        borderColor: '#FFA726',
      };
    case AssistanceLevel.Medium:
      return {
        label: 'Medio',
        textColor: 'light-dark(#E65100, #FFCC80)',
        backgroundColor: 'light-dark(#FFE0B2, #33200a)',
        borderColor: '#FF9800',
      };
    case AssistanceLevel.High:
      return {
        label: 'Alto',
        textColor: 'light-dark(#C62828, #FFCDD2)',
        backgroundColor: 'light-dark(#FFEBEE, #3b1214)',
        borderColor: '#E53935',
      };
    case AssistanceLevel.VeryHigh:
      return {
        label: 'Molto Alto',
        textColor: 'light-dark(#B71C1C, #FFEBEE)',
        backgroundColor: 'light-dark(#FFCDD2, #4a1416)',
        borderColor: '#D32F2F',
      };
    default:
      return {
        label: 'Sconosciuto',
        textColor: 'var(--mat-sys-on-surface)',
        backgroundColor: 'var(--mat-sys-surface)',
        borderColor: 'var(--mat-sys-outline)',
      };
  }
}
