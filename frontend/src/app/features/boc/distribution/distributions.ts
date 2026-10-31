import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateTime } from 'luxon';
import { map } from 'rxjs';
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
import { NewDistributionDialog } from './new-distribution-dialog/new-distribution-dialog';
import {
  DateSortDirection,
  DistributionFilter,
  filterDistributions,
  saveFile,
  sheetsFileName,
  sortDistributions,
} from './utils';

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
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatPaginatorModule,
  ],
  templateUrl: './distributions.html',
  styleUrl: './distributions.scss',
})
export class Distributions implements OnInit {
  private distributionService = inject(DistributionService);
  readonly _snackBar = inject(MatSnackBar);
  readonly dialogRef = inject(MatDialog);

  distributions = this.distributionService.distributions;
  loading = computed(() => this.distributionService.loading());

  readonly pageSizeOptions = [10, 25, 50];

  readonly filterForm = inject(FormBuilder).group({
    search: [''],
    from: [null as DateTime | null],
    to: [null as DateTime | null],
  });
  filter = toSignal(
    this.filterForm.valueChanges.pipe(map(() => this.toFilter())),
    { initialValue: this.toFilter() },
  );

  sortDirection = signal<DateSortDirection>('desc');
  filtered = computed(() =>
    sortDistributions(
      filterDistributions(this.distributions(), this.filter()),
      this.sortDirection(),
    ),
  );

  // Any filter change goes back to the first page and keeps the chosen page size
  page = linkedSignal<DistributionFilter, { pageIndex: number; pageSize: number }>({
    source: this.filter,
    computation: (_, previous) => ({ pageIndex: 0, pageSize: previous?.value.pageSize ?? 10 }),
  });
  // Clamped so the index stays valid when the filtered list shrinks
  pageIndex = computed(() =>
    Math.min(
      this.page().pageIndex,
      Math.max(0, Math.ceil(this.filtered().length / this.page().pageSize) - 1),
    ),
  );
  visible = computed(() => {
    const size = this.page().pageSize;
    const start = this.pageIndex() * size;
    return this.filtered().slice(start, start + size);
  });

  ngOnInit() {
    this.distributionService.fetchDistributions();
  }

  onNewDistribution() {
    const dialogRef = this.dialogRef.open(NewDistributionDialog, {
      width: '800px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        // save the distribution and show a snackbar
        this.distributionService.createDistribution(result).subscribe({
          next: (created) => this.downloadSheets(created),
          error: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Impossibile creare la distribuzione.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Distribuzione creata con successo!',
                status: SnackbarStatus.SUCCESS,
              },
            });
          },
        });
      }
    });
  }

  onExportSheets(distribution: Distribution) {
    this.downloadSheets(distribution);
  }

  private downloadSheets(distribution: Distribution) {
    if (!distribution.id) {
      return;
    }

    this.distributionService.downloadSheets(distribution.id).subscribe({
      next: (blob) => saveFile(blob, sheetsFileName(distribution.distributionDate)),
      error: () => {
        this._snackBar.openFromComponent(Snackbar, {
          data: {
            title: 'Impossibile generare le schede.',
            status: SnackbarStatus.ERROR,
          },
        });
      },
    });
  }

  toggleSort(): void {
    this.sortDirection.update((direction) => (direction === 'desc' ? 'asc' : 'desc'));
  }

  resetFilters(): void {
    this.filterForm.reset();
  }

  private toFilter(): DistributionFilter {
    const value = this.filterForm.getRawValue();
    return {
      search: value.search ?? '',
      from: value.from?.toISODate() ?? null,
      to: value.to?.toISODate() ?? null,
    };
  }

  getAccordionStyle(idx: number): Partial<CSSStyleDeclaration> {
    return {
      borderTop: idx === 0 ? '' : 'none',
      borderTopLeftRadius: idx === 0 ? '4px' : '0',
      borderTopRightRadius: idx === 0 ? '4px' : '0',
      borderBottomLeftRadius: idx === this.visible().length - 1 ? '4px' : '0',
      borderBottomRightRadius: idx === this.visible().length - 1 ? '4px' : '0',
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
