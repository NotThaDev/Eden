import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, OnInit, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { AssistanceLevel, Family } from '../../../core/models/family';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';
import { PageHeader } from '../../../shared/components/layouts/page-header/page-header';
import { Snackbar } from '../../../shared/components/snackbar/snackbar';
import { SnackbarStatus } from '../../../shared/components/snackbar/type';
import { FamilyService } from '../services/family.service';
import { CreateFamilyDialog } from './create-family-dialog/create-family-dialog';
import { LabelChip } from '../../../shared/components/label-chip/label-chip';
import { NecessityLevelSelect } from '../../../shared/components/necessity-level-select/necessity-level-select';
import { necessityLevelChipProps } from '../../../shared/components/necessity-level-select/necessity-level';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { FamilyFilter, FamilyTypeFilter, filterFamilies, sortFamilies } from './utils';
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
    MatSelectModule,
    ReactiveFormsModule,
    MatIconModule,
    LabelChip,
    NecessityLevelSelect,
    EmptyState,
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

  readonly pageSizeOptions = [10, 25, 50];

  filterForm = inject(FormBuilder).nonNullable.group({
    search: '',
    // explicit FormControl: a bare array literal would be read as a [value, validators] tuple
    levels: new FormControl<AssistanceLevel[]>([], { nonNullable: true }),
    type: 'all' as FamilyTypeFilter,
  });
  filter = toSignal(
    this.filterForm.valueChanges.pipe(map(() => this.filterForm.getRawValue())),
    { initialValue: this.filterForm.getRawValue() },
  );

  regularView = this.tableView(this.regularFamilies);
  occasionalView = this.tableView(this.occasionalFamilies);

  private tableView(source: Signal<Family[]>) {
    const sort = signal<Sort>({ active: '', direction: '' });
    // back to the first page whenever the filters change
    const page = linkedSignal<FamilyFilter, { pageIndex: number; pageSize: number }>({
      source: this.filter,
      computation: (_, prev) => ({ pageIndex: 0, pageSize: prev?.value.pageSize ?? 10 }),
    });
    const filtered = computed(() => sortFamilies(filterFamilies(source(), this.filter()), sort()));
    // clamp: data shrinking (e.g. a delete) can leave the current page out of range
    const pageIndex = computed(() =>
      Math.min(page().pageIndex, Math.max(0, Math.ceil(filtered().length / page().pageSize) - 1)),
    );
    const rows = computed(() => {
      const { pageSize } = page();
      return filtered().slice(pageIndex() * pageSize, (pageIndex() + 1) * pageSize);
    });
    return { sort, page, pageIndex, filtered, rows };
  }

  ngOnInit() {
    this.familyService.fetchFamilies();
  }

  resetFilters() {
    this.filterForm.reset();
  }

  readonly getNecessityGradeLabelProp = necessityLevelChipProps;

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
