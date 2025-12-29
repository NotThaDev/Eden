import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Family } from '../../../core/models/family';
import { PageHeader } from '../../../shared/components/layouts/page-header/page-header';
import { FamilyService } from '../services/family.service';
import { CreateFamilyDialog } from './create-family-dialog/create-family-dialog';
import { Snackbar } from '../../../shared/components/snackbar/snackbar';
import { SnackbarStatus } from '../../../shared/components/snackbar/type';

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

  private _snackBar = inject(MatSnackBar);

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
          error: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Failed to create family.',
                status: SnackbarStatus.ERROR,
              },
            });
          },
          complete: () => {
            this._snackBar.openFromComponent(Snackbar, {
              data: {
                title: 'Family successfully created!',
                status: SnackbarStatus.SUCCESS,
              },
            });
          },
        });
      }
    });
  }
}
