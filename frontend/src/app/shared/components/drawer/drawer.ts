import { Component, computed, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-drawer',
  imports: [MatIcon],
  templateUrl: './drawer.html',
  styleUrl: './drawer.scss',
})
export class Drawer {
  width = input<string | number>('400px');
  title = input.required<string>();
  isOpen = input.required<boolean>();
  onClose = output<void>();

  normalizedWidth = computed(() => {
    const w = this.width();
    if (typeof w === 'number') {
      return `${w}px`;
    }
    return w;
  });

  drawerPosition = computed(() => {
    return this.isOpen() ? '0' : `-${this.normalizedWidth()}`;
  });
}
