import { Component, computed, effect, input, output, signal } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Distribution } from '../../../../core/models/distribution';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

interface FoodColumn {
  key: string;
  id: number;
  label: string;
}

interface DistributionFamilyRow {
  familyId: number;
  familyName: string;
  [columnKey: string]: string | number;
}

@Component({
  selector: 'distribution-table',
  imports: [MatTableModule, EmptyState],
  templateUrl: './distribution-table.html',
  styleUrl: './distribution-table.scss',
})
export class DistributionTable {
  distribution = input.required<Distribution>();
  showTotals = input(false);
  editable = input(false);
  // Max total per food (keyed by foodId); a food without an entry has no limit
  limits = input<Record<number, number> | null>(null);
  quantityChange = output<{ familyId: number; foodId: number; quantity: number }>();

  readonly dataSource = new MatTableDataSource<DistributionFamilyRow>([]);
  readonly foodColumns = signal<FoodColumn[]>([]);
  readonly totals = signal<Record<string, number>>({});
  readonly trackByFamily = (_: number, row: DistributionFamilyRow) => row.familyId;
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
          familyId: familyDistribution.familyId,
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

      const totals: Record<string, number> = {};
      for (const foodColumn of dynamicColumns) {
        totals[foodColumn.key] = rows.reduce((sum, row) => {
          const value = row[foodColumn.key];
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);
      }
      this.totals.set(totals);

      this.foodColumns.set(dynamicColumns);
      this.dataSource.data = rows;
    });
  }

  limitFor(column: FoodColumn): number | null {
    return this.limits()?.[column.id] ?? null;
  }

  // Largest value this cell can take: the food limit minus what the other families already hold
  maxFor(row: DistributionFamilyRow, column: FoodColumn): number | null {
    const limit = this.limitFor(column);
    if (limit === null) {
      return null;
    }
    const cell = row[column.key];
    const value = typeof cell === 'number' ? cell : 0;
    const columnTotal = this.totals()[column.key] ?? 0;
    return Math.max(0, limit - (columnTotal - value));
  }

  onQuantityChange(row: DistributionFamilyRow, column: FoodColumn, event: Event): void {
    const input = event.target as HTMLInputElement;
    const max = this.maxFor(row, column);
    const quantity = Math.max(0, Math.min(max ?? Infinity, Math.floor(input.valueAsNumber || 0)));
    input.value = String(quantity);
    this.quantityChange.emit({ familyId: row.familyId, foodId: column.id, quantity });
  }
}
