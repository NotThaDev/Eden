import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { HttpHandler } from '../../../core/http/httpHandler';
import { Load } from '../../../core/models/load';

@Injectable({ providedIn: 'root' })
export class LoadService {
  private httpHandler = inject(HttpHandler);

  // Signals for state management
  private loadsSignal = signal<Load[]>([]);
  private loadingSignal = signal<boolean>(false);

  // Expose as readonly signals
  public loads = this.loadsSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();

  // Computed signal for total count (example of computed usage)
  public loadsCount = computed(() => this.loadsSignal().length);

  fetchLoads() {
    this.loadingSignal.set(true);
    this.httpHandler
      .get<Load[]>('api/load')
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe((loads) => this.loadsSignal.set(loads));
  }

  fetchLoadsByFoodId(foodId: number) {
    this.loadingSignal.set(true);
    this.httpHandler
      .get<Load[]>(`api/load/food/${foodId}`)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe((loads) => this.loadsSignal.set(loads));
  }

  createLoad(load: Load) {
    this.loadingSignal.set(true);

    return this.httpHandler.post<Load>('api/load', load).pipe(
      tap((newLoad) => {
        this.loadsSignal.update((loads) => [...loads, newLoad]);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  deleteLoad(loadId?: number) {
    if (!loadId) {
      throw new Error('Load ID is required for deletion.');
    }

    this.loadingSignal.set(true);

    return this.httpHandler.delete<void>(`api/load/${loadId}`).pipe(
      tap(() => {
        this.loadsSignal.update((loads) => loads.filter((load) => load.id !== loadId));
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  updateLoad(load: Load, id?: number) {
    if (!id) {
      throw new Error('Load ID is required for update.');
    }

    this.loadingSignal.set(true);

    return this.httpHandler.put<Load>(`api/load/${id}`, load).pipe(
      tap((updatedLoad) => {
        this.loadsSignal.update((loads) =>
          loads.map((f) => (f.id === updatedLoad.id ? updatedLoad : f))
        );
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }
}
