import { Component, input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink } from '@angular/router';
import { NavEntry } from '../types';

@Component({
  selector: 'app-sub-menu',
  imports: [MatSidenavModule, MatListModule, RouterLink],
  templateUrl: './sub-menu.html',
  styleUrl: './sub-menu.scss',
})
export class SubMenu {
  navEntry = input.required<NavEntry>();

  isRouteActive(routePath: string): boolean {
    return location.pathname === `/${routePath}`;
  }
}
