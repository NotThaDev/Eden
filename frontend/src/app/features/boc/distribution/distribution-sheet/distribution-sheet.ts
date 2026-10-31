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
  // Excel pads the table to at least 10 rows
  readonly emptyRows = computed(() => Array.from({ length: Math.max(0, 10 - this.foods().length) }));

  private settingsService = inject(SettingsService);
  readonly logoUrl = this.settingsService.logoUrl;

  constructor() {
    // Only the first sheet fetches; fetchSettings sets loading synchronously
    if (!this.settingsService.settings() && !this.settingsService.loading()) this.settingsService.fetchSettings();
  }

  quantity(foodId: number): number {
    return sheetQuantity(this.family(), foodId);
  }
}
