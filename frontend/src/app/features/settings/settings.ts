import { Component, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationDialog } from '../../shared/components/confirmation-dialog/confirmation-dialog';
import { PageHeader } from '../../shared/components/layouts/page-header/page-header';
import { Snackbar } from '../../shared/components/snackbar/snackbar';
import { SnackbarStatus } from '../../shared/components/snackbar/type';
import { SettingsService } from './services/settings.service';

const MAX_LOGO_BYTES = 1024 * 1024;

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIcon, PageHeader],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  private settingsService = inject(SettingsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly loading = this.settingsService.loading;
  readonly logoUrl = this.settingsService.logoUrl;

  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    address: [''],
    phone: [''],
    email: ['', Validators.email],
  });

  constructor() {
    effect(() => {
      const s = this.settingsService.settings();
      if (s) {
        this.form.patchValue({
          name: s.name, address: s.address ?? '', phone: s.phone ?? '', email: s.email ?? '',
        });
      }
    });
  }

  ngOnInit(): void {
    this.settingsService.fetchSettings();
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify('Inserisci il nome dell\'associazione.', SnackbarStatus.ERROR);
      return;
    }
    this.settingsService.updateSettings(this.form.getRawValue()).subscribe({
      error: () => this.notify('Impossibile salvare le impostazioni.', SnackbarStatus.ERROR),
      complete: () => this.notify('Impostazioni salvate!', SnackbarStatus.SUCCESS),
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow picking the same file again
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > MAX_LOGO_BYTES) {
      this.notify('Il logo deve essere PNG o JPEG, massimo 1 MB.', SnackbarStatus.ERROR);
      return;
    }
    this.settingsService.uploadLogo(file).subscribe({
      error: () => this.notify('Impossibile caricare il logo.', SnackbarStatus.ERROR),
      complete: () => this.notify('Logo caricato!', SnackbarStatus.SUCCESS),
    });
  }

  onRemoveLogo(): void {
    this.dialog
      .open(ConfirmationDialog, { data: { title: 'Rimuovere il logo?', message: 'Il logo non comparirà più sulle schede.' } })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed !== true) return;
        this.settingsService.deleteLogo().subscribe({
          error: () => this.notify('Impossibile rimuovere il logo.', SnackbarStatus.ERROR),
          complete: () => this.notify('Logo rimosso.', SnackbarStatus.SUCCESS),
        });
      });
  }

  private notify(title: string, status: SnackbarStatus): void {
    this.snackBar.openFromComponent(Snackbar, { data: { title, status } });
  }
}
