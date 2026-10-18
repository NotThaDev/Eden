import { CdkStepper } from '@angular/cdk/stepper';
import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

// Vertical step rail on the left, selected step content on the right
@Component({
  selector: 'side-stepper',
  imports: [NgTemplateOutlet, MatIcon],
  providers: [{ provide: CdkStepper, useExisting: SideStepper }],
  templateUrl: './side-stepper.html',
  styleUrl: './side-stepper.scss',
})
export class SideStepper extends CdkStepper {}
