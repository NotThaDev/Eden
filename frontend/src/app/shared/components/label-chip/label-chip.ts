import { Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-label-chip',
  imports: [MatChipsModule],
  templateUrl: './label-chip.html',
  styleUrl: './label-chip.scss',
})
export class LabelChip {
  label = input.required<string>();
  backgroundColor = input<string>('var(--mat-sys-surface-container-high)');
  textColor = input<string>('var(--mat-sys-on-surface)');
  borderColor = input<string>('var(--mat-sys-outline-variant)');

  border = computed(() => `1px solid ${this.borderColor()}`);
  color = computed(() => this.textColor());
}
