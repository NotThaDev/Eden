import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideLuxonDateAdapter } from '@angular/material-luxon-adapter';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarConfig } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';

import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';
import { MONTH_DAY_YEAR_FORMAT } from './shared/DateFormat';
import { italianPaginatorIntl } from './shared/paginator-intl';
import { provideHttpClient, withFetch } from '@angular/common/http';

const snackbarDefaultConfig: MatSnackBarConfig = {
  duration: 3000,
  horizontalPosition: 'center',
  verticalPosition: 'top',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideLuxonDateAdapter(MONTH_DAY_YEAR_FORMAT),
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: snackbarDefaultConfig },
    { provide: MatPaginatorIntl, useFactory: italianPaginatorIntl },
  ],
};
