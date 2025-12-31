import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatInputModule } from '@angular/material/input';
import { Food } from '../../../../core/models/food';

@Component({
  selector: 'app-update-food-dialog',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatGridListModule,
  ],
  templateUrl: './update-food-dialog.html',
  styleUrl: './update-food-dialog.scss',
})
export class UpdateFoodDialog implements OnInit {
  readonly data = inject<{ food?: Food }>(MAT_DIALOG_DATA, { optional: true });
  readonly title = this.data?.food ? `Edit ${this.data.food.name}` : 'Add a New Food ';
  readonly formBuilder = inject(FormBuilder);
  readonly foodFormControl: FormGroup = this.formBuilder.group({
    name: [null, [Validators.required, Validators.minLength(1)]],
    quantity: [null, [Validators.required]],
    unit: [null, [Validators.required]],
    unitSize: [null, [Validators.min(1), Validators.required]],
  });

  readonly dialogRef = inject(MatDialogRef<UpdateFoodDialog>);

  onClose(): void {
    if (this.foodFormControl.invalid) {
      return;
    }

    this.dialogRef.close(this.foodFormControl.value);
  }

  getLabelColor(field: string): string {
    if (this.foodFormControl.get(field)?.untouched) {
      return '';
    }

    return this.foodFormControl.get(field)?.valid ? '' : 'var(--mat-sys-error)';
  }

  getUnitLabelColor(): string {
    if (
      this.foodFormControl.get('unit')?.untouched &&
      this.foodFormControl.get('unitSize')?.untouched
    ) {
      return '';
    }

    return this.foodFormControl.get('unit')?.valid && this.foodFormControl.get('unitSize')?.valid
      ? ''
      : 'var(--mat-sys-error)';
  }

  ngOnInit(): void {
    if (this.data?.food) {
      const food = this.data.food;
      this.foodFormControl.get('name')?.setValue(food.name);
      this.foodFormControl.get('quantity')?.setValue(food.quantity);
      this.foodFormControl.get('unit')?.setValue(food.unit);
      this.foodFormControl.get('unitSize')?.setValue(food.unitSize);
    }
  }
}
