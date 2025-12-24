import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Family } from '../../../../core/models/family';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-family-dialog',
  templateUrl: 'create-family-dialog.html',
  styleUrls: ['create-family-dialog.scss'],
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
})
export class CreateFamilyDialog {
  readonly formBuilder = inject(FormBuilder);
  readonly familyFormControl = this.formBuilder.group({
    name: [''],
    members: [],
    children: [],
    isee: [],
  });

  readonly dialogRef = inject(MatDialogRef<CreateFamilyDialog>);

  onClose(): void {
    // #TODO add a proper validation mechanism
    if (this.familyFormControl.invalid) {
      return;
    }

    this.dialogRef.close(this.familyFormControl.value);
  }
}
