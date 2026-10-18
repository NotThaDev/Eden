import {
  CdkStep,
  CdkStepperNext,
  CdkStepperPrevious,
  StepperSelectionEvent,
} from '@angular/cdk/stepper';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatChip, MatChipRemove, MatChipSet } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelect, MatSelectTrigger } from '@angular/material/select';
import { DateTime } from 'luxon';
import { map, Subscription } from 'rxjs';
import { Distribution } from '../../../../core/models/distribution';
import { SideStepper } from '../../../../shared/components/side-stepper/side-stepper';
import { DistributionService } from '../../services/distribution.service';
import { FamilyService } from '../../services/family.service';
import { FoodService } from '../../services/food.service';
import { DistributionTable } from '../distribution-table/distribution-table';

const SUMMARY_STEP_INDEX = 2;

@Component({
  selector: 'app-new-distribution-dialog',
  imports: [
    MatButtonModule,
    CdkStep,
    CdkStepperNext,
    CdkStepperPrevious,
    SideStepper,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatCheckbox,
    MatIconModule,
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    MatOption,
    MatSelect,
    MatSelectTrigger,
    MatChipSet,
    MatChip,
    MatChipRemove,
    DistributionTable,
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

  families = this._familyService.families;
  // Only foods in stock can be distributed
  foods = computed(() => this._foodService.foods().filter((f) => f.quantity > 0));

  readonly today = DateTime.now().startOf('day');

  familiesForm = this._formBuilder.group({
    distributionDate: this._formBuilder.control<DateTime | null>(this.today, Validators.required),
    familyIds: this._formBuilder.nonNullable.control<number[]>([], Validators.required),
  });
  foodsForm = this._formBuilder.group({
    foodIds: this._formBuilder.nonNullable.control<number[]>([], Validators.required),
  });

  // Signals mirror the forms so zoneless change detection picks up changes made from overlays
  familyIds = toSignal(this.familiesForm.controls.familyIds.valueChanges, {
    initialValue: [] as number[],
  });
  foodIds = toSignal(this.foodsForm.controls.foodIds.valueChanges, {
    initialValue: [] as number[],
  });
  familiesInvalid = toSignal(
    this.familiesForm.statusChanges.pipe(map((status) => status !== 'VALID')),
    { initialValue: true },
  );
  foodsInvalid = toSignal(this.foodsForm.statusChanges.pipe(map((status) => status !== 'VALID')), {
    initialValue: true,
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
    if (event.selectedIndex === SUMMARY_STEP_INDEX) {
      this.loadPreview();
    }
  }

  loadPreview(): void {
    // Cancel an in-flight preview so an older response cannot overwrite a newer selection
    this._previewSubscription?.unsubscribe();
    this.preview.set(null);
    this.previewError.set(false);
    this.previewLoading.set(true);

    this._previewSubscription = this._distributionService
      .previewDistribution(
        this.familiesForm.controls.familyIds.value,
        this.foodsForm.controls.foodIds.value,
      )
      .subscribe({
        next: (distribution) => {
          this.preview.set(distribution);
          this.previewLoading.set(false);
        },
        error: () => {
          this.previewError.set(true);
          this.previewLoading.set(false);
        },
      });
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

  canCreate(): boolean {
    return (this.preview()?.items.length ?? 0) > 0;
  }

  onSubmit(): void {
    const preview = this.preview();
    const date = this.familiesForm.controls.distributionDate.value;
    if (preview && date && this.canCreate()) {
      // Noon keeps the same calendar day after the UTC conversion in any timezone
      this.dialogRef.close({ ...preview, distributionDate: date.set({ hour: 12 }).toJSDate() });
    }
  }
}
