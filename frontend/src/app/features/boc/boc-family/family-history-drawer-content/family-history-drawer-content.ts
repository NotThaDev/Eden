import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { LabelChip } from '../../../../shared/components/label-chip/label-chip';
import { FamilyService } from '../../services/family.service';
import { NecessityLevelChipProps } from '../utils';

@Component({
  selector: 'app-family-history-drawer-content',
  imports: [DatePipe, LabelChip, MatIcon],
  templateUrl: './family-history-drawer-content.html',
  styleUrl: './family-history-drawer-content.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyHistoryDrawerContent {
  familyId = input.required<number>();
  skipped = input(0);
  isOccasional = input(false);

  private familyService = inject(FamilyService);
  readonly history = this.familyService.familyHistory;

  readonly suggestion = computed(() => {
    if (this.skipped() > 5) return { level: 'alert', text: 'Valuta di contattare la famiglia o di rimuoverla.' };
    if (this.skipped() >= 4 && !this.isOccasional()) return { level: 'warn', text: 'Valuta di spostare la famiglia tra i saltuari.' };
    return null;
  });

  constructor() {
    effect(() => this.familyService.fetchFamilyHistory(this.familyId()));
  }

  statusProps(present: boolean): NecessityLevelChipProps {
    if (present) return { label: 'Presente', textColor: 'light-dark(#1B5E20, #A5D6A7)', backgroundColor: 'light-dark(#E8F5E9, #12291a)', borderColor: '#4CAF50' };
    return { label: 'Assente', textColor: 'light-dark(#C62828, #FFCDD2)', backgroundColor: 'light-dark(#FFEBEE, #3b1214)', borderColor: '#E53935' };
  }
}
