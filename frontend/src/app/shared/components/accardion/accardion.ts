import { CdkAccordionModule } from '@angular/cdk/accordion';
import { NgTemplateOutlet } from '@angular/common';
import { Component, input, TemplateRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'accardion',
  imports: [CdkAccordionModule, NgTemplateOutlet, MatIconModule],
  templateUrl: './accardion.html',
  styleUrl: './accardion.scss',
})
export class Accardion {
  title = input.required<string | TemplateRef<any>>();
  key = input.required<string>();
  defaultExpanded = input<boolean>(false);
  style = input<Partial<CSSStyleDeclaration>>();

  getTitleAsTemplateRef(): TemplateRef<any> | null {
    const titleValue = this.title();

    if (this.isTemplateRef(titleValue)) {
      return titleValue;
    }

    return null;
  }

  isTemplateRef(value: string | TemplateRef<any>): value is TemplateRef<any> {
    return value instanceof TemplateRef;
  }
}
