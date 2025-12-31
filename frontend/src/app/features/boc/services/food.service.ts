import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { HttpHandler } from '../../../core/http/httpHandler';
import { Food } from '../../../core/models/food';

@Injectable({ providedIn: 'root' })
export class FoodService {
  private httpHandler = inject(HttpHandler);

  // Signals for state management
  private foodsSignal = signal<Food[]>([]);
  private loadingSignal = signal<boolean>(false);

  // Expose as readonly signals
  public foods = this.foodsSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();

  // Computed signal for total count (example of computed usage)
  public foodsCount = computed(() => this.foodsSignal().length);

  fetchFoods() {
    this.loadingSignal.set(true);
    this.httpHandler
      .get<Food[]>('api/food')
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe((foods) => this.foodsSignal.set(foods));
  }

  createFood(food: Food) {
    this.loadingSignal.set(true);

    return this.httpHandler.post<Food>('api/food', food).pipe(
      tap((newFood) => {
        this.foodsSignal.update((foods) => [...foods, newFood]);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  deleteFood(foodId?: number) {
    if (!foodId) {
      throw new Error('Food ID is required for deletion.');
    }

    this.loadingSignal.set(true);

    return this.httpHandler.delete<void>(`api/food/${foodId}`).pipe(
      tap(() => {
        this.foodsSignal.update((foods) => foods.filter((food) => food.id !== foodId));
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  updateFood(food: Food, id?: number) {
    if (!id) {
      throw new Error('Food ID is required for update.');
    }

    this.loadingSignal.set(true);

    return this.httpHandler.put<Food>(`api/food/${id}`, food).pipe(
      tap((updatedFood) => {
        this.foodsSignal.update((foods) =>
          foods.map((f) => (f.id === updatedFood.id ? updatedFood : f))
        );
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
}
