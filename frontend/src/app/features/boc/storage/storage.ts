import { Component, computed, effect, inject, OnInit, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { map } from 'rxjs';
import { Food } from '../../../core/models/food';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';
import { Drawer } from '../../../shared/components/drawer/drawer';
import { PageHeader } from '../../../shared/components/layouts/page-header/page-header';
import { Snackbar } from '../../../shared/components/snackbar/snackbar';
import { SnackbarStatus } from '../../../shared/components/snackbar/type';
import { FoodService } from '../services/food.service';
import { LoadService } from '../services/load.service';
import { LoadDrawerContent } from './load-drawer-content/load-drawer-content';
import { NewLoadDialog } from './new-load-dialog/new-load-dialog';
import { UpdateFoodDialog } from './update-food-dialog/update-food-dialog';
import { foodSortValue, LOW_STOCK_THRESHOLD, matchesFoodFilter } from './utils';

@Component({
  selector: 'app-storage',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    PageHeader,
    MatButtonModule,
    MatIcon,
    Drawer,
    LoadDrawerContent,
  ],
  templateUrl: './storage.html',
  styleUrl: './storage.scss',
})
export class Storage implements OnInit {
  private foodService = inject(FoodService);
  private loadService = inject(LoadService);
  private _snackBar = inject(MatSnackBar);
  readonly dialogRef = inject(MatDialog);

  columns = ['name', 'quantity', 'unit', 'latestLoadId', 'actions'];
  dataSource = new MatTableDataSource<Food>([]);
  loading = computed(() => this.foodService.loading());
  selectedFoodId: number | null = null;

  filterForm = inject(FormBuilder).nonNullable.group({ search: '', lowStock: false });
  filter = toSignal(
    this.filterForm.valueChanges.pipe(map(() => this.filterForm.getRawValue())),
    { initialValue: this.filterForm.getRawValue() },
  );
  sort = viewChild(MatSort);
  paginator = viewChild(MatPaginator);
  readonly pageSizeOptions = [10, 25, 50];
  readonly lowStockThreshold = LOW_STOCK_THRESHOLD;

  constructor() {
    effect(() => {
      const data = this.foodService.foods();
      this.dataSource.data = data;
    });

    this.dataSource.filterPredicate = (food, raw) => matchesFoodFilter(food, JSON.parse(raw));
    this.dataSource.sortingDataAccessor = foodSortValue;

    effect(() => {
      this.dataSource.sort = this.sort() ?? null;
      this.dataSource.paginator = this.paginator() ?? null;
    });

    effect(() => {
      this.dataSource.filter = JSON.stringify(this.filter());
      this.dataSource.paginator?.firstPage();
    });
  }

  resetFilters(): void {
    this.filterForm.reset();
  }

  ngOnInit(): void {
    this.foodService.fetchFoods();
  }

  onAddFood(): void {
    const dialogRef = this.dialogRef.open(UpdateFoodDialog);

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.foodService.createFood(result).subscribe({
          error: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Impossibile creare l\'alimento.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Alimento creato con successo!',
                status: SnackbarStatus.SUCCESS,
              },
            });
          },
        });
      }
    });
  }

  onEditFood(food: Food): void {
    const dialogRef = this.dialogRef.open(UpdateFoodDialog, {
      data: {
        food,
        title: `Modifica ${food.name}`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.foodService.updateFood(result, food.id).subscribe({
          error: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Impossibile aggiornare l\'alimento.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Alimento aggiornato con successo!',
                status: SnackbarStatus.SUCCESS,
              },
            });
          },
        });
      }
    });
  }

  onDeleteFood(food: Food): void {
    if (!food.id) {
      return;
    }

    const dialogRef = this.dialogRef.open(ConfirmationDialog, {
      data: {
        title: `Eliminare "${food.name}"?`,
        message: `Sei sicuro di voler eliminare questo alimento? Questa azione non può essere annullata.`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.foodService.deleteFood(food.id).subscribe({
          error: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Impossibile eliminare l\'alimento.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Alimento eliminato con successo!',
                status: SnackbarStatus.SUCCESS,
              },
            });
          },
        });
      }
    });
  }

  onAddLoad(): void {
    const dialogRef = this.dialogRef.open(NewLoadDialog);

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.loadService.createLoad(result).subscribe({
          error: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Impossibile creare il carico.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Carico creato con successo!',
                status: SnackbarStatus.SUCCESS,
              },
            });

            this.foodService.fetchFoods();
          },
        });
      }
    });
  }

  onCloseFoodDetails(): void {
    this.selectedFoodId = null;
  }

  onViewLoad(foodId: number): void {
    this.selectedFoodId = foodId;
  }
}
