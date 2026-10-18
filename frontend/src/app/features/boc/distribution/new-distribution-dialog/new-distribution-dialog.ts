import { StepperSelectionEvent, STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChip, MatChipRemove, MatChipSet } from '@angular/material/chips';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatOption, MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Subscription } from 'rxjs';
import { Distribution } from '../../../../core/models/distribution';
import { DistributionService } from '../../services/distribution.service';
import { FamilyService } from '../../services/family.service';
import { FoodService } from '../../services/food.service';
import { DistributionTable } from '../distribution-table/distribution-table';

const SUMMARY_STEP_INDEX = 2;

@Component({
  selector: 'app-new-distribution-dialog',
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
  ],
  imports: [
    MatButtonModule,
    MatStepperModule,
    ReactiveFormsModule,
    MatFormFieldModule,
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

  familiesForm = this._formBuilder.group({
    familyIds: this._formBuilder.nonNullable.control<number[]>([], Validators.required),
  });
  foodsForm = this._formBuilder.group({
    foodIds: this._formBuilder.nonNullable.control<number[]>([], Validators.required),
  });

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

  canCreate(): boolean {
    return (this.preview()?.items.length ?? 0) > 0;
  }

  onSubmit(): void {
    if (this.canCreate()) {
      this.dialogRef.close(this.preview());
    }
  }
}
