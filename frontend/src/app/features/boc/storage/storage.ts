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
