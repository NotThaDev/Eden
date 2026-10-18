import { CdkStep, CdkStepper } from '@angular/cdk/stepper';
import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

// Vertical step rail on the left, selected step content on the right
@Component({
  selector: 'side-stepper',
  imports: [NgTemplateOutlet, MatIcon],
  providers: [{ provide: CdkStepper, useExisting: SideStepper }],
  templateUrl: './side-stepper.html',
  styleUrl: './side-stepper.scss',
})
export class SideStepper extends CdkStepper {
  // Material icon name per step, by index
  icons = input<string[]>([]);
  // Short text under each step label, by index
  descriptions = input<string[]>([]);

  protected iconFor(step: CdkStep, index: number): string {
    if (step.completed && this.selectedIndex !== index) {
      return 'check';
    }
    return this.icons()[index] || 'circle';
  }
}
