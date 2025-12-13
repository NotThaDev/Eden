import { Injectable } from '@angular/core';
import { HttpHandler } from '../../../core/http/httpHandler';
import { Family } from '../../../core/models/family';
import { BehaviorSubject, Observable, finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private familiesSubject = new BehaviorSubject<Family[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Expose as observables
  public families$ = this.familiesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Expose current value for sync access
  get families(): Family[] {
    return this.familiesSubject.value;
  }

  constructor(private httpHandler: HttpHandler) {
    this.loadFamilies();
  }

  private loadFamilies() {
    this.loadingSubject.next(true);
    this.httpHandler.get<Family[]>('api/family')
      .pipe(
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe({
        next: (families) => this.familiesSubject.next(families),
        error: (error) => console.error('Error loading families:', error)
      });
  }

  createFamily(family: Family): Observable<Family> {
    this.loadingSubject.next(true);
    const observable = this.httpHandler.post<Family>('api/family', family);
    
    observable.pipe(
      finalize(() => this.loadingSubject.next(false))
    ).subscribe({
      next: (newFamily) => {
        this.familiesSubject.next([...this.families, newFamily]);
      },
      error: (error) => console.error('Error creating family:', error)
    });
    
    return observable;
  }

  deleteFamily(familyId: number): Observable<void> {
    this.loadingSubject.next(true);
    const observable = this.httpHandler.delete<void>(`api/family/${familyId}`);
    
    observable.pipe(
      finalize(() => this.loadingSubject.next(false))
    ).subscribe({
      next: () => {
        this.familiesSubject.next(
          this.families.filter((family) => family.id !== familyId)
        );
      },
      error: (error) => console.error('Error deleting family:', error)
    });
    
    return observable;
  }

  updateFamily(family: Family): Observable<Family> {
    if (!family.id) {
      throw new Error('Family ID is required for update.');
    }
    this.loadingSubject.next(true);
    const observable = this.httpHandler.patch<Family>(`api/family/${family.id}`, family);
    
    observable.pipe(
      finalize(() => this.loadingSubject.next(false))
    ).subscribe({
      next: (updatedFamily) => {
        this.familiesSubject.next(
          this.families.map((f) => (f.id === updatedFamily.id ? updatedFamily : f))
        );
      },
      error: (error) => console.error('Error updating family:', error)
    });
    
    return observable;
  }
}
