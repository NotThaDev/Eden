import { Component, inject, signal } from '@angular/core';
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
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

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
  membersValidationError = signal<string>('');

  readonly formBuilder = inject(FormBuilder);
  readonly familyFormControl = this.formBuilder.group({
    name: [null, [Validators.required, Validators.minLength(1)]],
    members: [null, [Validators.required, Validators.min(1), this.membersValidator.bind(this)]],
    children: [0, [Validators.required, this.childrenValidator.bind(this)]],
    isee: [null, [Validators.required, Validators.min(0), Validators.max(10040)]],
  });

  readonly dialogRef = inject(MatDialogRef<CreateFamilyDialog>);

  private membersValidator(control: FormControl) {
    this.membersValidationError.set('');
    const childrenValue = this.familyFormControl?.get('children')?.value;
    const membersValue = control.value;

    const isMemberDefined = membersValue !== null && membersValue !== undefined;
    const isChildrenDefined = childrenValue !== null && childrenValue !== undefined;
    if (!isMemberDefined || !isChildrenDefined) {
      return null;
    }

    if (membersValue <= childrenValue) {
      this.membersValidationError.set('Total members must be greater than the number of children.');
      return { invalidMembersCount: true };
    }

    return null;
  }

  private childrenValidator(control: FormControl) {
    this.membersValidationError.set('');
    const membersValue = this.familyFormControl?.get('members')?.value;
    const childrenValue = control.value;

    const isMemberDefined = membersValue !== null && membersValue !== undefined;
    const isChildrenDefined = childrenValue !== null && childrenValue !== undefined;
    if (!isMemberDefined || !isChildrenDefined) {
      return null;
    }

    if (childrenValue >= membersValue) {
      this.membersValidationError.set('Number of children must be less than the total members.');
      return { invalidChildrenCount: true };
    }

    return null;
  }

  onClose(): void {
    if (this.familyFormControl.invalid) {
      return;
    }

    this.dialogRef.close(this.familyFormControl.value);
  }
}
