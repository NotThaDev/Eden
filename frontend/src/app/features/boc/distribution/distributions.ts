import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTableDataSource } from '@angular/material/table';
import { Distribution } from '../../../core/models/distribution';
import { Accordion } from '../../../shared/components/accordion/accordion';
import { LabelChip } from '../../../shared/components/label-chip/label-chip';
import { PageHeader } from '../../../shared/components/layouts/page-header/page-header';
import { DistributionService } from '../services/distribution.service';
import { DistributionTable } from './distribution-table/distribution-table';

@Component({
  selector: 'app-distributions',
  imports: [MatButton, PageHeader, Accordion, LabelChip, DatePipe, MatIcon, DistributionTable],
  templateUrl: './distributions.html',
  styleUrl: './distributions.scss',
})
export class Distributions implements OnInit {
  private distributionService = inject(DistributionService);
  readonly dialogRef = inject(MatDialog);

  dataSource = new MatTableDataSource<Distribution>([]);
  loading = computed(() => this.distributionService.loading());

  constructor() {
    effect(() => {
      const data = this.distributionService.distributions();
      this.dataSource.data = data;
    });
  }

  ngOnInit() {
    this.distributionService.fetchDistributions();
  }

  isDistributionPast(distributionDate: Date | string): boolean {
    const distributionDay = new Date(distributionDate);
    const today = new Date();

    distributionDay.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return distributionDay < today;
  }

  getDistributionChipColors(distributionDate: Date | string): {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
  } {
    if (this.isDistributionPast(distributionDate)) {
      return {
        backgroundColor: 'var(--mat-sys-surface-container-high)',
        borderColor: 'var(--mat-sys-outline)',
        textColor: 'var(--mat-sys-on-surface-variant)',
      };
    } else {
      return {
        backgroundColor: 'var(--info-blue-light)',
        borderColor: 'var(--info-blue-border)',
        textColor: 'var(--info-blue-dark)',
      };
    }
  }
}
