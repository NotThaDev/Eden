import { MatMenuModule } from '@angular/material/menu';
import { MediaMatcher } from '@angular/cdk/layout';
import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser, NgClass } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { routes } from '../../../../app.routes';
import { NavEntry } from '../types';
import { SubMenu } from '../sub-menu/sub-menu';
import { filter } from 'rxjs';

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

  platformId = inject(PLATFORM_ID);

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
  protected readonly isDark = signal(false);

  private readonly _document = inject(DOCUMENT);
  private readonly _darkQuery: MediaQueryList;
  private readonly _darkQueryListener: () => void;
  private readonly _mobileQuery: MediaQueryList;
  private readonly _mobileQueryListener: () => void;
  private readonly _router = inject(Router);

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

  protected toggleTheme(): void {
    const theme = this.isDark() ? 'light' : 'dark';
    const classList = this._document.documentElement.classList;
    classList.remove('theme-light', 'theme-dark');
    classList.add(`theme-${theme}`);
    this.isDark.set(theme === 'dark');

    try {
      localStorage.setItem('eden-theme', theme);
    } catch {
      // Storage unavailable (private mode): the choice lasts for this page only
    }
  }

  private resolveIsDark(): boolean {
    const classList = this._document.documentElement.classList;
    if (classList.contains('theme-dark')) return true;
    if (classList.contains('theme-light')) return false;
    return this._darkQuery.matches;
  }

  isRouteActive(path: string): boolean {
    return this._router.url.includes(path);
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

    this._mobileQuery = media.matchMedia('(max-width: 600px)');
    this.isMobile.set(this._mobileQuery.matches);
    this._mobileQueryListener = () => this.isMobile.set(this._mobileQuery.matches);

    this._darkQuery = media.matchMedia('(prefers-color-scheme: dark)');
    this._darkQueryListener = () => this.isDark.set(this.resolveIsDark());

    if (isPlatformBrowser(this.platformId)) {
      this._mobileQuery.addEventListener('change', this._mobileQueryListener);
      this.isDark.set(this.resolveIsDark());
      this._darkQuery.addEventListener('change', this._darkQueryListener);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this._mobileQuery.removeEventListener('change', this._mobileQueryListener);
      this._darkQuery.removeEventListener('change', this._darkQueryListener);
    }
  }

  ngOnInit(): void {
    // Listen to navigation events to get the correct URL (works with SSR)
    this._router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const currentPath = event.urlAfterRedirects;
        const matchingRoute = this.validRoutes.find((route) => currentPath.includes(route.path));

        if (matchingRoute && matchingRoute.children.length > 0) {
          this.openedSubmenu = matchingRoute.path;
        }
      });

    // Also check initial URL only in browser context
    if (isPlatformBrowser(this.platformId)) {
      const currentPath = this._router.url;
      const matchingRoute = this.validRoutes.find((route) => currentPath.includes(route.path));

      if (matchingRoute && matchingRoute.children.length > 0) {
        this.openedSubmenu = matchingRoute.path;
      }
    }
  }
}
