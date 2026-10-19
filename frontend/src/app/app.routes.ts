import { Route } from '@angular/router';
import { BocFamily } from './features/boc/boc-family/boc-family';
import { Storage } from './features/boc/storage/storage';
import { Distributions } from './features/boc/distribution/distributions';

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
    children: [
      { path: '', redirectTo: 'family', pathMatch: 'full', hide: true },
      {
        path: 'family',
        title: 'Famiglie',
        component: BocFamily,
      },
      {
        path: 'storage',
        title: 'Magazzino',
        component: Storage,
      },
      {
        path: 'distribution',
        title: 'Distribuzioni',
        component: Distributions,
      },
    ],
  },
  {
    path: 'settings',
    icon: 'tune',
    title: 'Impostazioni',
    // Lazy: keeps the settings page out of the initial bundle
    loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
  },
];
