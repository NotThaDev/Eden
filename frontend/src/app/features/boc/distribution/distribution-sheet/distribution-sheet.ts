import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Distribution, DistributionFamily } from '../../../../core/models/distribution';
import { sheetFoods, sheetQuantity } from '../utils';

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

  quantity(foodId: number): number {
    return sheetQuantity(this.family(), foodId);
  }
}
