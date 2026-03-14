import { Component, computed, effect, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatOption, MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatChipSet, MatChip, MatChipRemove } from '@angular/material/chips';
import { FamilyService } from '../../services/family.service';
import { Family } from '../../../../core/models/family';

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
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogContent,
    MatDialogTitle,
    MatOption,
    MatSelect,
    MatSelectTrigger,
    MatChipSet,
    MatChip,
    MatChipRemove,
  ],
  templateUrl: './new-distribution-dialog.html',
  styleUrl: './new-distribution-dialog.scss',
})
export class NewDistributionDialog implements OnInit {
  isLinear: any;
  private _formBuilder = inject(FormBuilder);
  private _familyService = inject(FamilyService);

  families = computed(() => this._familyService.families());
  selectedFamilyIds: number[] = [];

  firstFormGroup = this._formBuilder.group({
    firstCtrl: ['', Validators.required],
  });
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],
  });

  ngOnInit(): void {
    this._familyService.fetchFamilies();
  }

  removeFamily(id: number): void {
    this.selectedFamilyIds = this.selectedFamilyIds.filter((fId) => fId !== id);
  }

  getFamilyName(id: number): string {
    return this.families().find((f) => f.id === id)?.name ?? '';
  }
}
