import { Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-label-chip',
  imports: [MatChipsModule],
  templateUrl: './label-chip.html',
  styleUrl: './label-chip.scss',
})
export class LabelChip {
  label = input.required<string>();
  backGroundColor = input<string>('#F5F5F5');
  textColor = input<string>('#000000');
  borderColor = input<string>('#E0E0E0');
}
