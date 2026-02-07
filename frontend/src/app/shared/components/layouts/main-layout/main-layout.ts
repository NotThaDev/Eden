import { MatMenuModule } from '@angular/material/menu';
import { MediaMatcher } from '@angular/cdk/layout';
import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgClass } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { routes } from '../../../../app.routes';
import { NavEntry } from '../types';
import { SubMenu } from '../sub-menu/sub-menu';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  imports: [
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatTooltipModule,
    NgClass,
    RouterLink,
    SubMenu,
  ],
})
export class MainLayout implements OnDestroy, OnInit {
  @ViewChild(MatSidenav)
  sidenav!: MatSidenav;

  protected validRoutes: NavEntry[] = routes
    .filter((route) => !route.hide)
    .map((route) => {
      return {
        path: route.path,
        icon: route.icon,
        title: route.title,
        children: route.children?.filter((child) => !child.hide) ?? [],
      } as NavEntry;
    });

  openedSubmenu: string | null = null;

  toggleSubmenu(path: string) {
    const isSubmenuOpen = this.openedSubmenu === path;
    this.openedSubmenu = isSubmenuOpen ? null : path;
  }

  protected readonly isMobile = signal(true);
  protected readonly isMobileNavOpen = signal(false);
  protected readonly isNavbarCollapsed = signal(false);

  private readonly _mobileQuery: MediaQueryList;
  private readonly _mobileQueryListener: () => void;

  protected toggleNavbarCollapse(): void {
    if (!this.isNavbarCollapsed()) {
      this.openedSubmenu = null;
    }

    this.isNavbarCollapsed.set(!this.isNavbarCollapsed());
  }

  protected toggleMobileNavbar(): void {
    if (!this.isMobile()) return;
    this.isMobileNavOpen.set(!this.isMobileNavOpen());
    this.sidenav.toggle();
  }

  isRouteActive(path: string): boolean {
    return globalThis.location.pathname.includes(path);
  }

  onNavEntryClick(route: NavEntry): void {
    const hasChildren = route.children && route.children.length > 0;
    if (hasChildren) {
      this.toggleSubmenu(route.path);
      // Make sure to open the navbar when collapsed, if clicking a parent nav entry
      if (this.isNavbarCollapsed()) {
        this.toggleNavbarCollapse();
      }

      return;
    }

    this.openedSubmenu = null;
  }

  constructor() {
    const media = inject(MediaMatcher);
    const platformId = inject(PLATFORM_ID);

    this._mobileQuery = media.matchMedia('(max-width: 600px)');
    this.isMobile.set(this._mobileQuery.matches);
    this._mobileQueryListener = () => this.isMobile.set(this._mobileQuery.matches);

    if (isPlatformBrowser(platformId)) {
      this._mobileQuery.addEventListener('change', this._mobileQueryListener);
    }
  }

  ngOnDestroy(): void {
    this._mobileQuery.removeEventListener('change', this._mobileQueryListener);
  }

  ngOnInit(): void {
    const currentPath = globalThis.location.pathname;
    const matchingRoute = this.validRoutes.find((route) => currentPath.includes(route.path));

    if (matchingRoute && matchingRoute.children.length > 0) {
      this.openedSubmenu = matchingRoute.path;
    }
  }
}
