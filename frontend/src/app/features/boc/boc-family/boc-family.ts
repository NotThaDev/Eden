import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { AssistanceLevel, Family } from '../../../core/models/family';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';
import { PageHeader } from '../../../shared/components/layouts/page-header/page-header';
import { Snackbar } from '../../../shared/components/snackbar/snackbar';
import { SnackbarStatus } from '../../../shared/components/snackbar/type';
import { FamilyService } from '../services/family.service';
import { CreateFamilyDialog } from './create-family-dialog/create-family-dialog';
import { LabelChip } from '../../../shared/components/label-chip/label-chip';
import { NecessityLevelChipProps } from './utils';
import { Drawer } from '../../../shared/components/drawer/drawer';
import { FamilyHistoryDrawerContent } from './family-history-drawer-content/family-history-drawer-content';

@Component({
  selector: 'app-boc-family',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    PageHeader,
    MatIcon,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    LabelChip,
    Drawer,
    FamilyHistoryDrawerContent,
    NgTemplateOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './boc-family.html',
  styleUrl: './boc-family.scss',
})
export class BocFamily implements OnInit {
  private _snackBar = inject(MatSnackBar);

  private familyService = inject(FamilyService);
  readonly dialogRef = inject(MatDialog);

  displayedColumns: string[] = ['name', 'members', 'children', 'isee', 'necessityLevel', 'actions'];

  loading = computed(() => this.familyService.loading());
  selectedFamily = signal<Family | null>(null);
  private skippedStreaks = this.familyService.skippedStreaks;

  skippedCount(family: Family): number {
    return family.id ? (this.skippedStreaks()[family.id] ?? 0) : 0;
  }

  families = this.familyService.families;
  regularFamilies = computed(() => this.families().filter((f) => !f.isOccasional));
  occasionalFamilies = computed(() => this.families().filter((f) => f.isOccasional));

  ngOnInit() {
    this.familyService.fetchFamilies();
  }

  getNecessityGradeLabelProp(level: AssistanceLevel): NecessityLevelChipProps {
    switch (level) {
      case AssistanceLevel.VeryLow:
        return {
          label: 'Molto Basso',
          textColor: 'light-dark(#1B5E20, #A5D6A7)',
          backgroundColor: 'light-dark(#E8F5E9, #12291a)',
          borderColor: '#4CAF50',
        };
      case AssistanceLevel.Low:
        return {
          label: 'Basso',
          textColor: 'light-dark(#F57F17, #FFE082)',
          backgroundColor: 'light-dark(#FFF3E0, #2e2508)',
          borderColor: '#FFA726',
        };
      case AssistanceLevel.Medium:
        return {
          label: 'Medio',
          textColor: 'light-dark(#E65100, #FFCC80)',
          backgroundColor: 'light-dark(#FFE0B2, #33200a)',
          borderColor: '#FF9800',
        };
      case AssistanceLevel.High:
        return {
          label: 'Alto',
          textColor: 'light-dark(#C62828, #FFCDD2)',
          backgroundColor: 'light-dark(#FFEBEE, #3b1214)',
          borderColor: '#E53935',
        };
      case AssistanceLevel.VeryHigh:
        return {
          label: 'Molto Alto',
          textColor: 'light-dark(#B71C1C, #FFEBEE)',
          backgroundColor: 'light-dark(#FFCDD2, #4a1416)',
          borderColor: '#D32F2F',
        };
      default:
        return {
          label: 'Sconosciuto',
          textColor: 'var(--mat-sys-on-surface)',
          backgroundColor: 'var(--mat-sys-surface)',
          borderColor: 'var(--mat-sys-outline)',
        };
    }
  }

  deleteFamily(family: Family) {
    const dialogRef = this.dialogRef.open(ConfirmationDialog, {
      data: {
        title: `Eliminare la famiglia "${family.name}"?`,
        message: `Sei sicuro di voler eliminare questa famiglia? Questa azione non può essere annullata.`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.familyService.deleteFamily(family.id).subscribe({
          error: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Impossibile eliminare la famiglia.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Famiglia eliminata con successo!',
                status: SnackbarStatus.SUCCESS,
              },
            });
          },
        });
      }
    });
  }

  editFamily(family: Family) {
    const dialogRef = this.dialogRef.open(CreateFamilyDialog, {
      data: {
        family: family,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.familyService.updateFamily(result, family.id).subscribe({
          error: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Impossibile aggiornare la famiglia.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Famiglia aggiornata con successo!',
                status: SnackbarStatus.SUCCESS,
              },
            });
          },
        });
      }
    });
  }

  openDialog(): void {
    const dialogRef = this.dialogRef.open(CreateFamilyDialog);

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.familyService.createFamily(result).subscribe({
          error: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Impossibile creare la famiglia.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Famiglia creata con successo!',
                status: SnackbarStatus.SUCCESS,
              },
            });
          },
        });
      }
    });
  }
}
