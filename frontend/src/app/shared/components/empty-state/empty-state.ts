import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'empty-state',
  imports: [MatIcon],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  description = input<string>('Nessun dato trovato');
  icon = input<string>('inventory_2');
}
