import { Route } from '@angular/router';

interface EdenAppRoute extends Route {
  icon?: string;
  hide?: boolean;
  children?: EdenAppRoutes;
}
export type EdenAppRoutes = EdenAppRoute[];

export const routes: EdenAppRoutes = [
  {
    path: '',
    redirectTo: 'boc',
    pathMatch: 'full',
    hide: true,
  },
  {
    path: 'boc',
    icon: 'settings',
    title: 'BOC',
    // Lazy: keeps the BOC pages out of the initial bundle
    children: [
      { path: '', redirectTo: 'family', pathMatch: 'full', hide: true },
      {
        path: 'family',
        title: 'Famiglie',
        loadComponent: () =>
          import('./features/boc/boc-family/boc-family').then((m) => m.BocFamily),
      },
      {
        path: 'storage',
        title: 'Magazzino',
        loadComponent: () => import('./features/boc/storage/storage').then((m) => m.Storage),
      },
      {
        path: 'distribution',
        title: 'Distribuzioni',
        loadComponent: () =>
          import('./features/boc/distribution/distributions').then((m) => m.Distributions),
      },
    ],
  },
  {
    path: 'calendar',
    icon: 'event',
    title: 'Calendario',
    // Lazy: keeps the calendar out of the initial bundle
    loadComponent: () => import('./features/calendar/calendar').then((m) => m.Calendar),
  },
  {
    path: 'settings',
    hide: true,
    icon: 'tune',
    title: 'Impostazioni',
    // Lazy: keeps the settings page out of the initial bundle
    loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
  },
];
