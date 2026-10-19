import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { LabelChip } from '../../../../shared/components/label-chip/label-chip';
import { FamilyService } from '../../services/family.service';
import { NecessityLevelChipProps } from '../utils';

@Component({
  selector: 'app-family-history-drawer-content',
  imports: [DatePipe, LabelChip],
  templateUrl: './family-history-drawer-content.html',
  styleUrl: './family-history-drawer-content.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyHistoryDrawerContent {
  familyId = input.required<number>();

  private familyService = inject(FamilyService);
  readonly history = this.familyService.familyHistory;

  constructor() {
    effect(() => this.familyService.fetchFamilyHistory(this.familyId()));
  }

  statusProps(present: boolean | null): NecessityLevelChipProps {
    if (present === true) return { label: 'Presente', textColor: '#1B5E20', backgroundColor: '#E8F5E9', borderColor: '#4CAF50' };
    if (present === false) return { label: 'Assente', textColor: '#C62828', backgroundColor: '#FFEBEE', borderColor: '#E53935' };
    return { label: 'Non registrato', textColor: 'var(--mat-sys-on-surface-variant)', backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' };
  }
}
