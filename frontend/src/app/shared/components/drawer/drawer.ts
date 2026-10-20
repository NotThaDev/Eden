import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, input, output } from '@angular/core';
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

  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement;
    // Render at the end of <body> so the backdrop covers the sidebar too (page content has its own stacking context).
    afterNextRender(() => document.body.appendChild(host));
    inject(DestroyRef).onDestroy(() => host.remove());
  }

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
