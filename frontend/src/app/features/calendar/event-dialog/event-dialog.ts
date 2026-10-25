import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { DateTime } from 'luxon';
import { merge } from 'rxjs';
import { CalendarEvent } from '../../../core/models/event';
import { DEFAULT_EVENT_COLOR, EVENT_COLORS, EVENT_ICONS } from '../event-style';

export interface EventDialogData {
  event?: CalendarEvent;
  date?: DateTime;
}

export type EventDialogResult = { action: 'save'; event: CalendarEvent } | { action: 'delete' };

interface FormValue {
  allDay: boolean;
  icon: string | null;
  color: string;
  startDate: DateTime | null;
  startTime: string | null;
  endDate: DateTime | null;
  endTime: string | null;
}

// Start and end as local DateTimes, null while the form is incomplete
function toRange(v: FormValue): { start: DateTime; end: DateTime | null } | null {
  if (!v.startDate || (!v.allDay && !v.startTime)) return null;
  const at = (day: DateTime, time: string | null) => {
    const [hour, minute] = (time ?? '').split(':').map(Number);
    return day.set({ hour, minute, second: 0, millisecond: 0 });
  };
  const start = v.allDay ? v.startDate.startOf('day') : at(v.startDate, v.startTime);
  const end = !v.endDate ? null : v.allDay ? v.endDate.startOf('day') : at(v.endDate, v.endTime);
  return { start, end };
}

function rangeValidator(group: AbstractControl): ValidationErrors | null {
  const v = group.value as FormValue;
  if (!v.endDate) return null;
  if (!v.allDay && !v.endTime) return { endTimeRequired: true };
  const range = toRange(v);
  return range?.end && range.end.toMillis() < range.start.toMillis() ? { endBeforeStart: true } : null;
}

@Component({
  selector: 'app-event-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckbox,
    MatDatepickerModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormFieldModule,
    MatIcon,
    MatInputModule,
    MatMenuModule,
  ],
  templateUrl: './event-dialog.html',
  styleUrl: './event-dialog.scss',
})
export class EventDialog {
  readonly dialogRef = inject(MatDialogRef<EventDialog>);
  readonly data = inject<EventDialogData | null>(MAT_DIALOG_DATA, { optional: true });
  readonly title = this.data?.event ? 'Modifica evento' : 'Nuovo evento';
  readonly icons = Object.entries(EVENT_ICONS);
  readonly colors = Object.entries(EVENT_COLORS);

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      title: [this.data?.event?.title ?? '', [Validators.required, Validators.maxLength(200)]],
      allDay: [this.data?.event?.allDay ?? false],
      icon: [(this.data?.event?.icon ?? null) as string | null],
      color: [this.data?.event?.color ?? DEFAULT_EVENT_COLOR],
      startDate: [this.startDate() as DateTime | null, Validators.required],
      startTime: [this.startTime(), Validators.required],
      endDate: [this.endDate()],
      endTime: [this.endTime()],
      description: [this.data?.event?.description ?? '', Validators.maxLength(2000)],
    },
    { validators: rangeValidator },
  );

  // Signal mirrors the control so zoneless change detection reacts to the all-day toggle
  readonly allDay = toSignal(this.form.controls.allDay.valueChanges, {
    initialValue: this.form.controls.allDay.value,
  });

  readonly icon = toSignal(this.form.controls.icon.valueChanges, {
    initialValue: this.form.controls.icon.value,
  });

  private lastStart = toRange(this.form.getRawValue())?.start ?? null;

  constructor() {
    const { startDate, startTime } = this.form.controls;
    merge(startDate.valueChanges, startTime.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.keepDuration());
  }

  // Moving the start moves the end too, so the event keeps its duration
  private keepDuration(): void {
    const range = toRange(this.form.getRawValue());
    if (!range) return;
    if (this.lastStart && range.end) {
      const end = range.end.plus(range.start.diff(this.lastStart));
      this.form.controls.endDate.setValue(end.startOf('day'), { emitEvent: false });
      this.form.controls.endTime.setValue(end.toFormat('HH:mm'), { emitEvent: false });
    }
    this.lastStart = range.start;
  }

  private startDate(): DateTime {
    const ev = this.data?.event;
    if (ev) return DateTime.fromISO(ev.start).startOf('day');
    return (this.data?.date ?? DateTime.now()).startOf('day');
  }

  private startTime(): string {
    const ev = this.data?.event;
    return ev ? DateTime.fromISO(ev.start).toFormat('HH:mm') : '09:00';
  }

  // New events default to one hour on the start day
  private endDate(): DateTime | null {
    const ev = this.data?.event;
    if (!ev) return this.startDate();
    return ev.end ? DateTime.fromISO(ev.end).startOf('day') : null;
  }

  private endTime(): string {
    const ev = this.data?.event;
    if (!ev) return DateTime.fromFormat(this.startTime(), 'HH:mm').plus({ hours: 1 }).toFormat('HH:mm');
    return ev.end ? DateTime.fromISO(ev.end).toFormat('HH:mm') : '';
  }

  get formError(): string {
    if (this.form.hasError('endBeforeStart')) return "La fine non può essere prima dell'inizio.";
    if (this.form.hasError('endTimeRequired')) return "Inserisci l'orario di fine.";
    return '';
  }

  onDelete(): void {
    this.dialogRef.close({ action: 'delete' });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const range = toRange(v);
    if (!range) return;
    this.dialogRef.close({
      action: 'save',
      event: {
        id: this.data?.event?.id,
        title: v.title.trim(),
        description: v.description.trim() || null,
        start: range.start.toJSDate().toISOString(),
        end: range.end ? range.end.toJSDate().toISOString() : null,
        allDay: v.allDay,
        icon: v.icon,
        color: v.color,
      },
    });
  }
}
