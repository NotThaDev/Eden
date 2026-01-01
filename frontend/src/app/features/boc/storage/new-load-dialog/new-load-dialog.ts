import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FoodService } from '../../services/food.service';
import { MatSelect, MatOption } from "@angular/material/select";

@Component({
  selector: 'app-new-load-dialog',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatGridListModule,
    MatIconModule,
    MatSelect,
    MatOption
],
  templateUrl: './new-load-dialog.html',
  styleUrl: './new-load-dialog.scss',
})
export class NewLoadDialog implements OnInit {
  private _foodService = inject(FoodService);

  readonly foods = computed(() => this._foodService.foods());

  readonly dialogRef = inject(MatDialogRef<NewLoadDialog>);
  readonly formBuilder = inject(FormBuilder);

  readonly loadFormControl: FormGroup = this.formBuilder.group({
    loadDate: [null, [Validators.required]],
    items: this.formBuilder.array([]),
  });

  get items(): FormArray {
    return this.loadFormControl.get('items') as FormArray;
  }

  // Create a new LoadItem FormGroup
  createLoadItem(): FormGroup {
    return this.formBuilder.group({
      foodId: ['', [Validators.required]],
      quantity: [0, [Validators.required, Validators.min(1)]],
    });
  }

  // Add a new item to the FormArray
  addItem(): void {
    this.items.push(this.createLoadItem());
  }

  // Remove an item from the FormArray
  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  // Submit the form
  onSubmit(): void {
    if (this.loadFormControl.valid) {
      console.log(this.loadFormControl.value);
      this.dialogRef.close(this.loadFormControl.value);
    }
  }

  ngOnInit(): void {
    this._foodService.fetchFoods();
  }
}
