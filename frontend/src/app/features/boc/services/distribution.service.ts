import { inject, Injectable, signal } from '@angular/core';
import { Family } from '../../../core/models/family';
import { HttpHandler } from '../../../core/http/httpHandler';
import { finalize, tap } from 'rxjs';
import { Distribution } from '../../../core/models/distribution';
import { Food } from '../../../core/models/food';

@Injectable({
  providedIn: 'root',
})
export class DistributionService {
  private httpHandler = inject(HttpHandler);

  // Signals for state management
  private distributionsSignal = signal<Distribution[]>([]);
  private loadingSignal = signal<boolean>(false);
  private distributionPreviewSignal = signal<Distribution | null>(null);

  // Expose as readonly signals
  public distributionPreview = this.distributionPreviewSignal.asReadonly();

  // Expose as readonly signals
  public distributions = this.distributionsSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();

  fetchDistributions() {
    this.loadingSignal.set(true);
    this.httpHandler
      .get<Distribution[]>('api/distribution')
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe((distributions) => this.distributionsSignal.set(distributions));
  }

  createDistribution(distribution: Distribution) {
    this.loadingSignal.set(true);

    return this.httpHandler.post<Distribution>('api/distribution', distribution).pipe(
      tap((newDistribution) => {
        this.distributionsSignal.update((distributions) => [...distributions, newDistribution]);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  deleteDistribution(distributionId?: number) {
    if (!distributionId) {
      throw new Error('Distribution ID is required for deletion.');
    }

    this.loadingSignal.set(true);

    return this.httpHandler.delete<void>(`api/distribution/${distributionId}`).pipe(
      tap(() => {
        this.distributionsSignal.update((distributions) =>
          distributions.filter((distribution) => distribution.id !== distributionId),
        );
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  updateDistribution(distribution: Distribution, id?: number) {
    if (!id) {
      throw new Error('Distribution ID is required for update.');
    }

    this.loadingSignal.set(true);

    return this.httpHandler.put<Distribution>(`api/distribution/${id}`, distribution).pipe(
      tap((updatedDistribution) => {
        this.distributionsSignal.update((distributions) =>
          distributions.map((d) => (d.id === updatedDistribution.id ? updatedDistribution : d)),
        );
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  previewDistribution(families: Family[], foods: Food[]) {
    this.loadingSignal.set(true);

    const familyIds = families.map((family) => family.id);
    const foodIds = foods.map((food) => food.id);
    const body = { familyIds, foodIds };
    return this.httpHandler.post<Distribution>('api/distribution/preview', body).pipe(
      tap((newDistribution) => {
        this.distributionPreviewSignal.set(newDistribution);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }
}
