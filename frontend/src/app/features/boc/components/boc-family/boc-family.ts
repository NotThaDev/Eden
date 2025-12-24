import {
  AfterViewInit,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Family } from '../../../../core/models/family';
import { PageHeader } from '../../../../shared/components/layouts/page-header/page-header';
import { FamilyService } from '../../services/family.service';
import { CreateFamilyDialog } from '../create-family-dialog/create-family-dialog';

import { ChangeDetectionStrategy } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-boc-family',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    PageHeader,
    MatIcon,
    MatButtonModule,
    MatDialogModule,

    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './boc-family.html',
  styleUrl: './boc-family.scss',
})
export class BocFamily implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private familyService = inject(FamilyService);
  readonly dialog = inject(MatDialog);

  displayedColumns: string[] = ['name', 'members', 'children', 'isee'];

  dataSource = new MatTableDataSource<Family>([]);
  loading = computed(() => this.familyService.loading());

  constructor() {
    effect(() => {
      const data = this.familyService.families();
      this.dataSource.data = data;
    });
  }

  ngOnInit() {
    this.familyService.fetchFamilies();
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(CreateFamilyDialog);

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.familyService.createFamily(result).subscribe({
          error: (error) => {
            // TODO: Add error handling (e.g., show a snackbar/toast)
            console.error('Error creating family:', error);
          },
        });
      }
    });
  }
}
