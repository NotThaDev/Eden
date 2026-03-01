import { Component, computed, effect, input, signal } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Distribution } from '../../../../core/models/distribution';

interface FoodColumn {
  key: string;
  id: number;
  label: string;
}

interface DistributionFamilyRow {
  familyName: string;
  [columnKey: string]: string | number;
}

@Component({
  selector: 'distribution-table',
  imports: [MatTableModule],
  templateUrl: './distribution-table.html',
  styleUrl: './distribution-table.scss',
})
export class DistributionTable {
  distribution = input.required<Distribution>();

  readonly dataSource = new MatTableDataSource<DistributionFamilyRow>([]);
  readonly foodColumns = signal<FoodColumn[]>([]);
  readonly displayedColumns = computed<string[]>(() => [
    'familyName',
    ...this.foodColumns().map((column) => column.key),
  ]);

  constructor() {
    effect(() => {
      const currentDistribution = this.distribution();
      const columnsMap = new Map<number, FoodColumn>();

      for (const familyDistribution of currentDistribution.items) {
        for (const distributionItem of familyDistribution.distributionItems) {
          if (distributionItem.food && !columnsMap.has(distributionItem.foodId)) {
            columnsMap.set(distributionItem.foodId, {
              key: `food-${distributionItem.foodId}`,
              id: distributionItem.foodId,
              label: distributionItem.food.name,
            });
          }
        }
      }

      const dynamicColumns = Array.from(columnsMap.values()).sort((left, right) =>
        left.label.localeCompare(right.label),
      );

      const rows = currentDistribution.items.map((familyDistribution) => {
        const row: DistributionFamilyRow = {
          familyName: familyDistribution.family?.name ?? 'N/A',
        };

        for (const foodColumn of dynamicColumns) {
          row[foodColumn.key] = '-';
        }

        for (const distributionItem of familyDistribution.distributionItems) {
          if (!distributionItem.food) {
            continue;
          }
          const columnKey = `food-${distributionItem.foodId}`;
          const currentValue = row[columnKey];
          const numericValue = typeof currentValue === 'number' ? currentValue : 0;
          row[columnKey] = numericValue + distributionItem.quantity;
        }

        return row;
      });

      this.foodColumns.set(dynamicColumns);
      this.dataSource.data = rows;
    });
  }
}
