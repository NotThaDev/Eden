import { CdkStep, StepperSelectionEvent } from '@angular/cdk/stepper';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatChip, MatChipRemove, MatChipSet } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelect, MatSelectTrigger } from '@angular/material/select';
import { DateTime } from 'luxon';
import { map, Subscription } from 'rxjs';
import { Distribution, DistributionFamily } from '../../../../core/models/distribution';
import { Food } from '../../../../core/models/food';
import { SideStepper } from '../../../../shared/components/side-stepper/side-stepper';
import { DistributionService } from '../../services/distribution.service';
import { FamilyService } from '../../services/family.service';
import { FoodService } from '../../services/food.service';
import { DistributionSheet } from '../distribution-sheet/distribution-sheet';
import { sheetFamilies } from '../utils';
import { DistributionTable } from '../distribution-table/distribution-table';

const SUMMARY_STEP_INDEX = 2;
const LAST_STEP_INDEX = 3;

@Component({
  selector: 'app-new-distribution-dialog',
  imports: [
    MatButtonModule,
    CdkStep,
    SideStepper,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatCheckbox,
    MatIconModule,
    MatDialogTitle,
    MatDialogActions,
    MatOption,
    MatSelect,
    MatSelectTrigger,
    MatChipSet,
    MatChip,
    MatChipRemove,
    DistributionTable,
    DistributionSheet,
  ],
  templateUrl: './new-distribution-dialog.html',
  styleUrl: './new-distribution-dialog.scss',
})
export class NewDistributionDialog implements OnInit {
  private _formBuilder = inject(FormBuilder);
  private _familyService = inject(FamilyService);
  private _foodService = inject(FoodService);
  private _distributionService = inject(DistributionService);
  readonly dialogRef = inject(MatDialogRef<NewDistributionDialog>);
  readonly data = inject<{ distribution?: Distribution } | null>(MAT_DIALOG_DATA, {
    optional: true,
  });
  readonly editing = this.data?.distribution;
  readonly isEdit = !!this.editing;
  private readonly _editedFoods: Food[] = [
    ...new Map(
      (this.editing?.items ?? [])
        .flatMap((family) => family.distributionItems)
        .flatMap((item) => (item.food ? [[item.foodId, item.food] as const] : [])),
    ).values(),
  ];
  // Families deleted since the distribution come back as id 0 and cannot be edited; the backend keeps their items
  readonly initialFamilyIds: number[] =
    this.editing?.items.map((i) => i.familyId).filter((id) => id > 0) ?? [];
  readonly initialFoodIds: number[] = [
    ...new Set(
      (this.editing?.items ?? []).flatMap((family) =>
        family.distributionItems.map((item) => item.foodId),
      ),
    ),
  ];
  // Edited quantities keyed `${familyId}-${foodId}`; a missing key means 0
  readonly quantities = signal(
    new Map<string, number>(
      (this.editing?.items ?? []).flatMap((family) =>
        family.distributionItems.map(
          (item) => [`${family.familyId}-${item.foodId}`, item.quantity] as [string, number],
        ),
      ),
    ),
  );

  // Quantity each food already holds in the edited distribution (it goes back to stock when saved)
  private readonly _held = (this.editing?.items ?? []).reduce((held, family) => {
    if (family.familyId > 0) {
      for (const item of family.distributionItems) {
        held.set(item.foodId, (held.get(item.foodId) ?? 0) + item.quantity);
      }
    }
    return held;
  }, new Map<number, number>());
  // Key of the selection the last successful create-mode preview was loaded for
  private _previewKey = '';

  families = this._familyService.families;
  // Only foods in stock can be distributed; edit mode also keeps the edited foods (even at 0 stock)
  foods = computed(() => {
    const fetched = this._foodService.foods();
    const editedIds = new Set(this.initialFoodIds);
    const available = fetched.filter(
      (f) => f.quantity > 0 || (this.isEdit && editedIds.has(f.id ?? -1)),
    );
    const missing = this._editedFoods.filter((ef) => !fetched.some((f) => f.id === ef.id));
    return [...available, ...missing];
  });
  // Max total per food: current stock plus what the edited distribution already holds
  foodLimits = computed<Record<number, number>>(() => {
    const limits: Record<number, number> = {};
    for (const food of this._foodService.foods()) {
      if (food.id !== undefined) {
        limits[food.id] = food.quantity + (this._held.get(food.id) ?? 0);
      }
    }
    for (const [foodId, held] of this._held) {
      limits[foodId] ??= held;
    }
    return limits;
  });

  readonly today = DateTime.now().startOf('day');
  readonly SUMMARY_STEP_INDEX = SUMMARY_STEP_INDEX;
  readonly LAST_STEP_INDEX = LAST_STEP_INDEX;
  currentStep = signal(0);
  sheetIndex = signal(0);
  sheetFamilies = computed(() => {
    const preview = this.activePreview();
    return preview ? sheetFamilies(preview) : [];
  });
  // Preview without zero-quantity items (what gets saved and shown on the sheets)
  activePreview = computed(() => {
    const preview = this.preview();
    return preview ? this.withoutEmptyItems(preview) : null;
  });

  familiesForm = this._formBuilder.group({
    distributionDate: this._formBuilder.control<DateTime | null>(
      this.editing
        ? DateTime.fromJSDate(new Date(this.editing.distributionDate)).startOf('day')
        : this.today,
      Validators.required,
    ),
    familyIds: this._formBuilder.nonNullable.control<number[]>(
      this.initialFamilyIds,
      Validators.required,
    ),
  });
  foodsForm = this._formBuilder.group({
    foodIds: this._formBuilder.nonNullable.control<number[]>(
      this.initialFoodIds,
      Validators.required,
    ),
  });

  // Signals mirror the forms so zoneless change detection picks up changes made from overlays
  familyIds = toSignal(this.familiesForm.controls.familyIds.valueChanges, {
    initialValue: this.initialFamilyIds,
  });
  foodIds = toSignal(this.foodsForm.controls.foodIds.valueChanges, {
    initialValue: this.initialFoodIds,
  });
  familiesInvalid = toSignal(
    this.familiesForm.statusChanges.pipe(map((status) => status !== 'VALID')),
    { initialValue: !this.isEdit },
  );
  foodsInvalid = toSignal(this.foodsForm.statusChanges.pipe(map((status) => status !== 'VALID')), {
    initialValue: !this.isEdit,
  });

  allFamiliesSelected = computed(
    () => this.families().length > 0 && this.familyIds().length === this.families().length,
  );
  someFamiliesSelected = computed(() => this.familyIds().length > 0 && !this.allFamiliesSelected());
  allFoodsSelected = computed(
    () => this.foods().length > 0 && this.foodIds().length === this.foods().length,
  );
  someFoodsSelected = computed(() => this.foodIds().length > 0 && !this.allFoodsSelected());

  preview = signal<Distribution | null>(null);
  previewLoading = signal(false);
  previewError = signal(false);
  private _previewSubscription?: Subscription;

  ngOnInit(): void {
    this._familyService.fetchFamilies();
    this._foodService.fetchFoods();
  }

  onStepChange(event: StepperSelectionEvent): void {
    this.currentStep.set(event.selectedIndex);
    if (event.selectedIndex === SUMMARY_STEP_INDEX) {
      if (this.isEdit) {
        this.buildPreview();
      } else if (this._previewKey === this.selectionKey()) {
        // Same selection as the loaded preview: keep the edited quantities
        this.previewError.set(false);
        this.buildPreview();
      } else {
        this.loadPreview();
      }
    }
    // The sheets show the chosen date, not the preview's
    const date = this.familiesForm.controls.distributionDate.value;
    if (event.selectedIndex === LAST_STEP_INDEX && date) {
      this.preview.update(
        (p) => p && { ...p, distributionDate: date.set({ hour: 12 }).toJSDate() },
      );
    }
  }

  private selectionKey(): string {
    return JSON.stringify([
      this.familiesForm.controls.familyIds.value,
      this.foodsForm.controls.foodIds.value,
    ]);
  }

  loadPreview(): void {
    // Cancel an in-flight preview so an older response cannot overwrite a newer selection
    this._previewSubscription?.unsubscribe();
    this._previewKey = '';
    const key = this.selectionKey();
    this.preview.set(null);
    this.sheetIndex.set(0);
    this.previewError.set(false);
    this.previewLoading.set(true);

    this._previewSubscription = this._distributionService
      .previewDistribution(
        this.familiesForm.controls.familyIds.value,
        this.foodsForm.controls.foodIds.value,
      )
      .subscribe({
        next: (distribution) => {
          // Seed the editable quantities with the backend allocation (summed per family and food)
          const allocated = new Map<string, number>();
          for (const family of distribution.items) {
            for (const item of family.distributionItems) {
              const quantityKey = `${family.familyId}-${item.foodId}`;
              allocated.set(quantityKey, (allocated.get(quantityKey) ?? 0) + item.quantity);
            }
          }
          this.quantities.set(allocated);
          this._previewKey = key;
          this.buildPreview();
          this.previewLoading.set(false);
        },
        error: () => {
          this.previewError.set(true);
          this.previewLoading.set(false);
        },
      });
  }

  // Builds the preview locally from the quantities (the backend preview ignores edits)
  buildPreview(): void {
    const quantities = this.quantities();
    const foodIds = this.foodsForm.controls.foodIds.value;
    const items: DistributionFamily[] = this.familiesForm.controls.familyIds.value.map(
      (familyId) => ({
        familyId,
        family:
          this.families().find((f) => f.id === familyId) ??
          this.editing?.items.find((i) => i.familyId === familyId)?.family,
        distributionItems: foodIds.map((foodId) => ({
          foodId,
          food: this.foods().find((f) => f.id === foodId),
          quantity: quantities.get(`${familyId}-${foodId}`) ?? 0,
        })),
      }),
    );
    this.preview.set({
      id: this.editing?.id,
      distributionDate: this.editing?.distributionDate ?? new Date(),
      items,
    });
    this.sheetIndex.set(0);
  }

  onQuantityChange({
    familyId,
    foodId,
    quantity,
  }: {
    familyId: number;
    foodId: number;
    quantity: number;
  }): void {
    this.quantities.update((map) => new Map(map).set(`${familyId}-${foodId}`, quantity));
    this.buildPreview();
  }

  toggleAllFamilies(checked: boolean): void {
    const control = this.familiesForm.controls.familyIds;
    control.setValue(checked ? this.families().flatMap((f) => f.id ?? []) : []);
    control.markAsTouched();
  }

  toggleAllFoods(checked: boolean): void {
    const control = this.foodsForm.controls.foodIds;
    control.setValue(checked ? this.foods().flatMap((f) => f.id ?? []) : []);
    control.markAsTouched();
  }

  removeFamily(id: number): void {
    const control = this.familiesForm.controls.familyIds;
    control.setValue(control.value.filter((fId) => fId !== id));
    control.markAsTouched();
  }

  removeFood(id: number): void {
    const control = this.foodsForm.controls.foodIds;
    control.setValue(control.value.filter((fId) => fId !== id));
    control.markAsTouched();
  }

  getFamilyName(id: number): string {
    return this.families().find((f) => f.id === id)?.name ?? '';
  }

  getFoodName(id: number): string {
    return this.foods().find((f) => f.id === id)?.name ?? '';
  }

  selectedLabel(count: number, singular: string, plural: string): string {
    return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
  }

  currentStepInvalid(): boolean {
    switch (this.currentStep()) {
      case 0:
        return this.familiesInvalid();
      case 1:
        return this.foodsInvalid();
      case 2:
        return !this.canCreate();
      default:
        return false;
    }
  }

  moveSheet(offset: number): void {
    const count = this.sheetFamilies().length;
    this.sheetIndex.update((index) => Math.min(Math.max(index + offset, 0), count - 1));
  }

  // Edit mode: every selected family needs at least one item with quantity > 0
  hasEmptyFamily(): boolean {
    return (
      this.isEdit &&
      (this.preview()?.items ?? []).some(
        (family) => !family.distributionItems.some((item) => item.quantity > 0),
      )
    );
  }

  canCreate(): boolean {
    return (this.activePreview()?.items.length ?? 0) > 0 && !this.hasEmptyFamily();
  }

  // Drops zero-quantity items and the families left without any item
  private withoutEmptyItems(distribution: Distribution): Distribution {
    return {
      ...distribution,
      items: distribution.items
        .map((family) => ({
          ...family,
          distributionItems: family.distributionItems.filter((item) => item.quantity > 0),
        }))
        .filter((family) => family.distributionItems.length > 0),
    };
  }

  onSubmit(): void {
    const preview = this.activePreview();
    const date = this.familiesForm.controls.distributionDate.value;
    if (preview && date && this.canCreate()) {
      // Noon keeps the same calendar day after the UTC conversion in any timezone
      this.dialogRef.close({ ...preview, distributionDate: date.set({ hour: 12 }).toJSDate() });
    }
  }
}
