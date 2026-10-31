import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { CdkTrapFocus } from '@angular/cdk/a11y';
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

type Theme = 'light' | 'dark' | 'system';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  imports: [
    MatToolbarModule,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    CdkTrapFocus,
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
  protected readonly theme = signal<Theme>('system');
  protected readonly themeOptions: { value: Theme; icon: string; label: string }[] = [
    { value: 'dark', icon: 'dark_mode', label: 'Tema scuro' },
    { value: 'light', icon: 'light_mode', label: 'Tema chiaro' },
    { value: 'system', icon: 'brightness_auto', label: 'Tema di sistema' },
  ];
  protected readonly isSettingsMenuOpen = signal(false);
  // Open to the right of the entry, growing upward; fall back to above it so it stays on screen
  protected readonly settingsMenuPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'bottom', offsetX: 8 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 },
  ];

  protected closeSettingsMenu(): void {
    this.isSettingsMenuOpen.set(false);
  }

  protected onSettingsMenuOutsideClick(event: MouseEvent, trigger: HTMLElement): void {
    // Clicks on the trigger are handled by its own (click) toggle
    if (trigger.contains(event.target as Node)) return;
    // cdkTrapFocus returns focus to the trigger on close: give it back to what the user clicked
    const clicked = this._document.activeElement as HTMLElement | null;
    this.closeSettingsMenu();
    if (clicked && clicked !== this._document.body) setTimeout(() => clicked.focus());
  }

  // Escape is handled by cdkConnectedOverlay; role="menu" expects arrow keys to move between items
  protected onSettingsMenuKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(this._document.querySelectorAll<HTMLElement>('.settings-menu-item'));
    const current = items.indexOf(this._document.activeElement as HTMLElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    items[(current + step + items.length) % items.length]?.focus();
  }

  private readonly _document = inject(DOCUMENT);
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

  // 'system' drops the class and the stored choice, so prefers-color-scheme applies (see index.html)
  protected setTheme(theme: Theme): void {
    const classList = this._document.documentElement.classList;
    classList.remove('theme-light', 'theme-dark');
    if (theme !== 'system') classList.add(`theme-${theme}`);
    this.theme.set(theme);

    try {
      if (theme === 'system') localStorage.removeItem('eden-theme');
      else localStorage.setItem('eden-theme', theme);
    } catch {
      // Storage unavailable (private mode): the choice lasts for this page only
    }
  }

  isRouteActive(path: string): boolean {
    return this._router.url.includes(path);
  }

  // Leaf entries leave the open submenu alone: it closes only from its own parent entry
  onNavEntryClick(route: NavEntry): void {
    const hasChildren = route.children && route.children.length > 0;
    if (!hasChildren) return;

    this.toggleSubmenu(route.path);
    // Make sure to open the navbar when collapsed, if clicking a parent nav entry
    if (this.isNavbarCollapsed()) {
      this.toggleNavbarCollapse();
    }
  }

  constructor() {
    const media = inject(MediaMatcher);

    this._mobileQuery = media.matchMedia('(max-width: 600px)');
    this.isMobile.set(this._mobileQuery.matches);
    this._mobileQueryListener = () => this.isMobile.set(this._mobileQuery.matches);

    if (isPlatformBrowser(this.platformId)) {
      this._mobileQuery.addEventListener('change', this._mobileQueryListener);
      const classList = this._document.documentElement.classList;
      this.theme.set(
        classList.contains('theme-dark')
          ? 'dark'
          : classList.contains('theme-light')
            ? 'light'
            : 'system',
      );
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this._mobileQuery.removeEventListener('change', this._mobileQueryListener);
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
