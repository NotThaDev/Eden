import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AssistanceLevel, Family } from '../../../core/models/family';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';
import { PageHeader } from '../../../shared/components/layouts/page-header/page-header';
import { Snackbar } from '../../../shared/components/snackbar/snackbar';
import { SnackbarStatus } from '../../../shared/components/snackbar/type';
import { FamilyService } from '../services/family.service';
import { CreateFamilyDialog } from './create-family-dialog/create-family-dialog';
import { LabelChip } from '../../../shared/components/label-chip/label-chip';

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

  dataSource = new MatTableDataSource<Family>([]);
  loading = computed(() => this.familyService.loading());

  constructor() {
    effect(() => {
      const data = this.familyService.families();
      this.dataSource.data = data;
    });
  }

  ngOnInit() {
    this.familyService.fetchFamilies();
  }

  getNecessityGradeLabelProp(level: AssistanceLevel): {
    label: string;
    textColor: string;
    backgroundColor: string;
    borderColor: string;
  } {
    switch (level) {
      case AssistanceLevel.VeryLow:
        return {
          label: 'Very Low',
          textColor: '#1B5E20',
          backgroundColor: '#E8F5E9',
          borderColor: '#4CAF50',
        };
      case AssistanceLevel.Low:
        return {
          label: 'Low',
          textColor: '#F57F17',
          backgroundColor: '#FFF3E0',
          borderColor: '#FFA726',
        };
      case AssistanceLevel.Medium:
        return {
          label: 'Medium',
          textColor: '#E65100',
          backgroundColor: '#FFE0B2',
          borderColor: '#FF9800',
        };
      case AssistanceLevel.High:
        return {
          label: 'High',
          textColor: '#C62828',
          backgroundColor: '#FFEBEE',
          borderColor: '#E53935',
        };
      case AssistanceLevel.VeryHigh:
        return {
          label: 'Very High',
          textColor: '#B71C1C',
          backgroundColor: '#FFCDD2',
          borderColor: '#D32F2F',
        };
      default:
        return level;
    }
  }

  deleteFamily(family: Family) {
    const dialogRef = this.dialogRef.open(ConfirmationDialog, {
      data: {
        title: `Delete "${family.name}" Family?`,
        message: `Are you sure you want to delete this family? This action cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.familyService.deleteFamily(family.id).subscribe({
          error: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Failed to delete family.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Family successfully deleted!',
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
                title: 'Failed to update family.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Family successfully updated!',
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
                title: 'Failed to create family.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Family successfully created!',
                status: SnackbarStatus.SUCCESS,
              },
            });
          },
        });
      }
    });
  }
}
