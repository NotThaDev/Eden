import { Component, inject } from '@angular/core';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { SnackbarData, SnackbarStatus } from './type';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-snackbar',
  imports: [MatIcon],
  templateUrl: './snackbar.html',
  styleUrl: './snackbar.css',
})
export class Snackbar {
  snackBarRef = inject(MatSnackBarRef);
  data = inject<SnackbarData>(MAT_SNACK_BAR_DATA);

  getIcon(): string {
    if (this.data.customIcon) {
      return this.data.customIcon;
    }
    switch (this.data.status) {
      case SnackbarStatus.SUCCESS:
        return 'check_circle_outline';
      case SnackbarStatus.ERROR:
        return 'cancel';
      case SnackbarStatus.INFO:
        return 'info';
      case SnackbarStatus.WARNING:
        return 'warning';
      default:
        return '';
    }
  }

  getIconColor(): string {
    console.log(this.data.status);
    switch (this.data.status) {
      case SnackbarStatus.SUCCESS:
        return '#4CAF50'; // Green
      case SnackbarStatus.ERROR:
        return '#F44336'; // Red
      case SnackbarStatus.INFO:
        return '#2196F3'; // Blue
      case SnackbarStatus.WARNING:
        return '#FF9800'; // Orange
      default:
        return '#000000'; // Default to black
    }
  }

  getBorderColor(): string {
    switch (this.data.status) {
      case SnackbarStatus.SUCCESS:
        return '#4CAF50'; // Green
      case SnackbarStatus.ERROR:
        return '#F44336'; // Red
      case SnackbarStatus.INFO:
        return '#2196F3'; // Blue
      case SnackbarStatus.WARNING:
        return '#FF9800'; // Orange
      default:
        return '#000000'; // Default to black
    }
  }
}
