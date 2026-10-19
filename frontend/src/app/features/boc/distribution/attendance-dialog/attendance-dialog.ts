import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { DistributionAttendance } from '../../../../core/models/distribution';

@Component({
  selector: 'app-attendance-dialog',
  imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions],
  templateUrl: './attendance-dialog.html',
  styleUrl: './attendance-dialog.scss',
})
export class AttendanceDialog {
  readonly data = inject<{ attendance: DistributionAttendance[] }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AttendanceDialog>);
  // Unrecorded families start unchecked; saving records them as absent.
  readonly rows = signal(this.data.attendance.map((a) => ({ ...a, present: a.present ?? false })));

  setPresent(familyId: number, present: boolean): void {
    this.rows.update((rows) => rows.map((r) => (r.familyId === familyId ? { ...r, present } : r)));
  }
}
