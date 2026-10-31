import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AssistanceLevel } from '../../../core/models/family';
import { LabelChip } from '../label-chip/label-chip';
import { necessityLevelChipProps } from './necessity-level';

@Component({
  selector: 'app-necessity-level-select',
  imports: [MatFormFieldModule, MatSelectModule, LabelChip],
  templateUrl: './necessity-level-select.html',
  styleUrl: './necessity-level-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NecessityLevelSelect), multi: true }],
})
export class NecessityLevelSelect implements ControlValueAccessor {
  label = input('Grado di Necessità');
  readonly levels = Object.values(AssistanceLevel);
  readonly chipProps = necessityLevelChipProps;
  readonly value = signal<AssistanceLevel[]>([]);
  readonly disabled = signal(false);
  private onChange: (value: AssistanceLevel[]) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: AssistanceLevel[] | null): void {
    this.value.set(value ?? []);
  }
  registerOnChange(fn: (value: AssistanceLevel[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  select(value: AssistanceLevel[]): void {
    this.value.set(value);
    this.onChange(value);
  }
}
