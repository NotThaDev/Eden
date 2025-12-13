import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { PageHeader } from '../../../../shared/components/layouts/page-header/page-header';
import { Family } from './../../../../core/models/family';
import { FamilyService } from './../../services/family.service';

@Component({
  selector: 'app-boc-family',
  imports: [MatTableModule, MatPaginatorModule, MatSortModule, PageHeader],
  templateUrl: './boc-family.html',
  styleUrl: './boc-family.scss',
})
export class BocFamily implements AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['name', 'members', 'children', 'isee'];
  dataSource = new MatTableDataSource<Family>([]);
  loading = true;

  private subscription = new Subscription();

  constructor(protected familyService: FamilyService) {
    this.subscription.add(
      this.familyService.families$.subscribe((families) => {
        this.dataSource.data = families;
      })
    );

    this.subscription.add(
      this.familyService.loading$.subscribe((loading) => {
        this.loading = loading;
      })
    );
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
