import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { HttpHandler } from '../../../core/http/httpHandler';
import { AssociationSettings } from '../../../core/models/settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private httpHandler = inject(HttpHandler);

  private settingsSignal = signal<AssociationSettings | null>(null);
  private loadingSignal = signal<boolean>(false);
  // Bumped on logo change so the <img> does not show a cached image
  private logoVersionSignal = signal(Date.now());

  public settings = this.settingsSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();
  public logoUrl = computed(() =>
    this.settingsSignal()?.hasLogo
      ? `${this.httpHandler.normalizeUrl('api/settings/logo')}?v=${this.logoVersionSignal()}`
      : null,
  );

  fetchSettings() {
    this.loadingSignal.set(true);
    this.httpHandler
      .get<AssociationSettings>('api/settings')
      .pipe(finalize(() => this.loadingSignal.set(false)))
      .subscribe((settings) => this.settingsSignal.set(settings));
  }

  updateSettings(settings: AssociationSettings) {
    this.loadingSignal.set(true);
    return this.httpHandler.put<AssociationSettings>('api/settings', settings).pipe(
      tap((saved) => this.settingsSignal.set(saved)),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  uploadLogo(file: File) {
    const body = new FormData();
    body.append('file', file);
    this.loadingSignal.set(true);
    return this.httpHandler.put<AssociationSettings>('api/settings/logo', body).pipe(
      tap((saved) => {
        this.settingsSignal.set(saved);
        this.logoVersionSignal.set(Date.now());
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  deleteLogo() {
    this.loadingSignal.set(true);
    return this.httpHandler.delete<void>('api/settings/logo').pipe(
      tap(() => this.settingsSignal.update((s) => (s ? { ...s, hasLogo: false } : s))),
      finalize(() => this.loadingSignal.set(false)),
    );
  }
}
