import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { LoadService } from '../../services/load.service';
import { DatePipe, NgStyle } from '@angular/common';
import { LabelChip } from '../../../../shared/components/label-chip/label-chip';
import { Accardion } from '../../../../shared/components/accardion/accardion';

@Component({
  selector: 'app-load-drawer-content',
  imports: [MatExpansionModule, DatePipe, LabelChip, Accardion],
  templateUrl: './load-drawer-content.html',
  styleUrl: './load-drawer-content.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadDrawerContent {
  foodId = input<number | null>(null);

  private loadService = inject(LoadService);
  readonly loads = this.loadService.loads;

  getAccordionStyle(idx: number): Partial<CSSStyleDeclaration> {
    return {
      borderTop: idx === 0 ? '' : 'none',
      borderTopLeftRadius: idx === 0 ? '4px' : '0',
      borderTopRightRadius: idx === 0 ? '4px' : '0',
      borderBottomLeftRadius: idx === this.loads().length - 1 ? '4px' : '0',
      borderBottomRightRadius: idx === this.loads().length - 1 ? '4px' : '0',
    };
  }

  constructor() {
    effect(() => {
      const currentFoodId = this.foodId();

      if (currentFoodId) {
        this.loadService.fetchLoadsByFoodId(currentFoodId);
      }
    });
  }
}
