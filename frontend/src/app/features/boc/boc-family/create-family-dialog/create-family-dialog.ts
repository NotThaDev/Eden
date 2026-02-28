import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import { Family } from '../../../../core/models/family';

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
// #TODO use a more generic name like (e.g., FamilyDialog) since it is also used for editing
export class CreateFamilyDialog implements OnInit {
  membersValidationError = signal<string>('');

  readonly data = inject<{ family?: Family }>(MAT_DIALOG_DATA, { optional: true });
  readonly title = this.data?.family ? `Modifica ${this.data.family.name}` : 'Aggiungi una Nuova Famiglia';
  readonly formBuilder = inject(FormBuilder);
  readonly familyFormControl: FormGroup = this.formBuilder.group({
    name: [null, [Validators.required, Validators.minLength(1)]],
    members: [null, [Validators.required, Validators.min(1), this.membersValidator.bind(this)]],
    children: [null, [Validators.required, this.childrenValidator.bind(this)]],
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
      this.membersValidationError.set('Il numero totale di membri deve essere maggiore del numero di bambini.');
      return { invalidMembersCount: true };
    }

    if (this.familyFormControl.get('children')?.invalid) {
      this.familyFormControl?.get('children')?.updateValueAndValidity({ emitEvent: true });
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
      this.membersValidationError.set('Il numero di bambini deve essere inferiore al numero totale di membri.');
      return { invalidChildrenCount: true };
    }

    if (this.familyFormControl.get('members')?.invalid) {
      this.familyFormControl?.get('members')?.updateValueAndValidity({ emitEvent: true });
    }
    return null;
  }

  onClose(): void {
    if (this.familyFormControl.invalid) {
      return;
    }

    this.dialogRef.close(this.familyFormControl.value);
  }

  ngOnInit(): void {
    if (this.data?.family) {
      const family = this.data.family;
      this.familyFormControl.get('name')?.setValue(family.name);
      this.familyFormControl.get('members')?.setValue(family.members);
      this.familyFormControl.get('children')?.setValue(family.children);
      this.familyFormControl.get('isee')?.setValue(family.isee);
    }
  }
}
