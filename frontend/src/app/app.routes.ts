import { Route } from '@angular/router';
import { BocFamily } from './features/boc/pages/boc-family/boc-family';

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
        title: 'Families',
        component: BocFamily,
      },
    ],
  },
];
