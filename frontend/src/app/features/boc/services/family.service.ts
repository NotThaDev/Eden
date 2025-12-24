import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpHandler } from '../../../core/http/httpHandler';
import { Family } from '../../../core/models/family';
import { finalize, tap } from 'rxjs';
import { error } from 'console';

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private httpHandler = inject(HttpHandler);

  // Signals for state management
  private familiesSignal = signal<Family[]>([]);
  private loadingSignal = signal<boolean>(false);

  // Expose as readonly signals
  public families = this.familiesSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();

  // Computed signal for total count (example of computed usage)
  public familiesCount = computed(() => this.familiesSignal().length);

  fetchFamilies() {
    this.loadingSignal.set(true);
    this.httpHandler
      .get<Family[]>('api/family')
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe((families) => this.familiesSignal.set(families));
  }

  createFamily(family: Family) {
    this.loadingSignal.set(true);

    return this.httpHandler.post<Family>('api/family', family).pipe(
      tap((newFamily) => {
        this.familiesSignal.update((families) => [...families, newFamily]);
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  deleteFamily(familyId: number) {
    this.loadingSignal.set(true);

    return this.httpHandler.delete<void>(`api/family/${familyId}`).pipe(
      tap(() => {
        this.familiesSignal.update((families) =>
          families.filter((family) => family.id !== familyId)
        );
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  updateFamily(family: Family) {
    if (!family.id) {
      throw new Error('Family ID is required for update.');
    }
    this.loadingSignal.set(true);

    return this.httpHandler
      .patch<Family>(`api/family/${family.id}`, family)
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe({
        next: (updatedFamily) => {
          this.familiesSignal.update((families) =>
            families.map((f) => (f.id === updatedFamily.id ? updatedFamily : f))
          );
        },
        error: (error) => console.error('Error updating family:', error),
      });
  }
}
