import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Distribution } from '../../../core/models/distribution';
import { Accordion } from '../../../shared/components/accordion/accordion';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { LabelChip } from '../../../shared/components/label-chip/label-chip';
import { PageHeader } from '../../../shared/components/layouts/page-header/page-header';
import { Snackbar } from '../../../shared/components/snackbar/snackbar';
import { SnackbarStatus } from '../../../shared/components/snackbar/type';
import { DistributionService } from '../services/distribution.service';
import { DistributionTable } from './distribution-table/distribution-table';
import { NewDistributionDialog } from './new-distribution-dialog/new-distribution-dialog';
import { saveFile, sheetsFileName } from './utils';

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
  readonly _snackBar = inject(MatSnackBar);
  readonly dialogRef = inject(MatDialog);

  distributions = this.distributionService.distributions;
  loading = computed(() => this.distributionService.loading());

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

  getAccordionStyle(idx: number): Partial<CSSStyleDeclaration> {
    return {
      borderTop: idx === 0 ? '' : 'none',
      borderTopLeftRadius: idx === 0 ? '4px' : '0',
      borderTopRightRadius: idx === 0 ? '4px' : '0',
      borderBottomLeftRadius: idx === this.distributions().length - 1 ? '4px' : '0',
      borderBottomRightRadius: idx === this.distributions().length - 1 ? '4px' : '0',
    };
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
