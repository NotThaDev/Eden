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
  backgroundColor = input<string>('#F5F5F5');
  textColor = input<string>('var(--mat-sys-on-surface)');
  borderColor = input<string>('#E0E0E0');

  border = computed(() => `1px solid ${this.borderColor()}`);
  color = computed(() => this.textColor());
}
