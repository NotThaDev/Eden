import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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

@Component({
  selector: 'app-storage',
  imports: [MatTableModule, PageHeader, MatButtonModule, MatIcon, Drawer, LoadDrawerContent],
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

  constructor() {
    effect(() => {
      const data = this.foodService.foods();
      this.dataSource.data = data;
    });
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
                title: 'Failed to create food.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Food successfully created!',
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
        title: `Edit ${food.name}`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.foodService.updateFood(result, food.id).subscribe({
          error: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Failed to update food.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Food successfully updated!',
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
        title: `Delete "${food.name}"?`,
        message: `Are you sure you want to delete this food? This action cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.foodService.deleteFood(food.id).subscribe({
          error: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Failed to delete food.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Food successfully deleted!',
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
                title: 'Failed to create load.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Load successfully created!',
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
