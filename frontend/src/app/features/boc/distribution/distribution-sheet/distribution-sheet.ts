import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { Distribution, DistributionFamily } from '../../../../core/models/distribution';
import { sheetFoods, sheetQuantity } from '../utils';
import { SettingsService } from '../../../settings/services/settings.service';

// Preview of one printable sheet (one family), same content as the Excel block
@Component({
  selector: 'app-distribution-sheet',
  imports: [DatePipe],
  templateUrl: './distribution-sheet.html',
  styleUrl: './distribution-sheet.scss',
})
export class DistributionSheet {
  distribution = input.required<Distribution>();
  family = input.required<DistributionFamily>();

  readonly foods = computed(() => sheetFoods(this.distribution()));

  private settingsService = inject(SettingsService);
  readonly title = computed(() => this.settingsService.settings()?.effectiveSheetTitle ?? 'Scheda distribuzione');
  readonly logoUrl = this.settingsService.logoUrl;

  constructor() {
    // Only the first sheet fetches; fetchSettings sets loading synchronously
    if (!this.settingsService.settings() && !this.settingsService.loading()) this.settingsService.fetchSettings();
  }

  quantity(foodId: number): number {
    return sheetQuantity(this.family(), foodId);
  }
}
