import { Component, input, OnInit, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-drawer',
  imports: [MatIcon],
  templateUrl: './drawer.html',
  styleUrl: './drawer.scss',
})
export class Drawer implements OnInit {
  width = input<string | number>();
  title = input.required<string>();
  isOpen = input.required<boolean>();
  onClose = output<void>();

  normalizedWidth: string = '350px';

  ngOnInit(): void {
    if (this.width === undefined) {
      return;
    }

    if (typeof this.width === 'number') {
      const numberWidth = Number(this.width);
      if (isNaN(numberWidth) || numberWidth <= 0) {
        return;
      }
      this.normalizedWidth = `${this.width}px`;
    } else {
      this.normalizedWidth = this.width.toString();
    }
  }
}
