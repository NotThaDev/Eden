import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Distribution } from '../../../core/models/distribution';
import { Accordion } from '../../../shared/components/accordion/accordion';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { LabelChip } from '../../../shared/components/label-chip/label-chip';
import { PageHeader } from '../../../shared/components/layouts/page-header/page-header';
import { Snackbar } from '../../../shared/components/snackbar/snackbar';
import { SnackbarStatus } from '../../../shared/components/snackbar/type';
import { DistributionService } from '../services/distribution.service';
import { AttendanceDialog } from './attendance-dialog/attendance-dialog';
import { DistributionTable } from './distribution-table/distribution-table';

@Component({
  selector: 'app-distributions',
  imports: [
    MatButton,
    PageHeader,
    Accordion,
    LabelChip,
    DatePipe,
    MatIcon,
    DistributionTable,
    EmptyState,
  ],
  templateUrl: './distributions.html',
  styleUrl: './distributions.scss',
})
export class Distributions implements OnInit {
  private distributionService = inject(DistributionService);
  readonly dialogRef = inject(MatDialog);
  private _snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<Distribution>([]);
  loading = computed(() => this.distributionService.loading());

  constructor() {
    effect(() => {
      const data = this.distributionService.distributions();
      this.dataSource.data = data;
    });
  }

  ngOnInit() {
    this.distributionService.fetchDistributions();
  }

  getAccordionStyle(idx: number): Partial<CSSStyleDeclaration> {
    return {
      borderTop: idx === 0 ? '' : 'none',
      borderTopLeftRadius: idx === 0 ? '4px' : '0',
      borderTopRightRadius: idx === 0 ? '4px' : '0',
      borderBottomLeftRadius: idx === this.dataSource.data.length - 1 ? '4px' : '0',
      borderBottomRightRadius: idx === this.dataSource.data.length - 1 ? '4px' : '0',
    };
  }

  onOpenAttendance(distributionId?: number): void {
    if (!distributionId) {
      return;
    }

    this.distributionService.getAttendance(distributionId).subscribe({
      error: () => this.showSnackbar('Impossibile caricare le presenze.', SnackbarStatus.ERROR),
      next: (attendance) => {
        this.dialogRef
          .open(AttendanceDialog, { data: { attendance } })
          .afterClosed()
          .subscribe((result) => {
            if (result === undefined) {
              return;
            }
            this.distributionService.updateAttendance(distributionId, result).subscribe({
              error: () => this.showSnackbar('Impossibile salvare le presenze.', SnackbarStatus.ERROR),
              complete: () => this.showSnackbar('Presenze salvate con successo!', SnackbarStatus.SUCCESS),
            });
          });
      },
    });
  }

  private showSnackbar(title: string, status: SnackbarStatus): void {
    this._snackBar.openFromComponent(Snackbar, { data: { title, status } });
  }

  isDistributionPast(distributionDate: Date | string): boolean {
    const distributionDay = new Date(distributionDate);
    const today = new Date();

    distributionDay.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return distributionDay < today;
  }

  getDistributionChipColors(distributionDate: Date | string): {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
  } {
    if (this.isDistributionPast(distributionDate)) {
      return {
        backgroundColor: 'var(--mat-sys-surface-container-high)',
        borderColor: 'var(--mat-sys-outline)',
        textColor: 'var(--mat-sys-on-surface-variant)',
      };
    } else {
      return {
        backgroundColor: 'var(--info-blue-light)',
        borderColor: 'var(--info-blue-border)',
        textColor: 'var(--info-blue-dark)',
      };
    }
  }
}
