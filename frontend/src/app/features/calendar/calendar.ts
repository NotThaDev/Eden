import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { DateTime } from 'luxon';
import { Observable, Subscription } from 'rxjs';
import { CalendarEvent } from '../../core/models/event';
import { ConfirmationDialog } from '../../shared/components/confirmation-dialog/confirmation-dialog';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../shared/components/layouts/page-header/page-header';
import { Snackbar } from '../../shared/components/snackbar/snackbar';
import { SnackbarStatus } from '../../shared/components/snackbar/type';
import { EventDialog, EventDialogData, EventDialogResult } from './event-dialog/event-dialog';
import { EventService } from './services/event.service';

const MAX_CHIPS = 3;
const DIALOG_CONFIG = { width: '480px', maxWidth: '95vw' };

interface CalendarDay {
  date: DateTime;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  visible: CalendarEvent[];
  hidden: number;
}

// Full weeks (Monday first) covering the month; end is exclusive
function gridRange(month: DateTime): { start: DateTime; end: DateTime } {
  return {
    start: month.startOf('week'),
    end: month.endOf('month').endOf('week').startOf('day').plus({ days: 1 }),
  };
}

// Events overlapping the local day `day` (already startOf('day'))
function eventsOn(events: CalendarEvent[], day: DateTime): CalendarEvent[] {
  return events.filter((ev) => {
    const startsBy = DateTime.fromISO(ev.start).startOf('day').toMillis() <= day.toMillis();
    const endsAfter =
      ev.allDay || !ev.end
        ? DateTime.fromISO(ev.end ?? ev.start).startOf('day').toMillis() >= day.toMillis()
        : DateTime.fromISO(ev.end).toMillis() > day.toMillis();
    return startsBy && endsAfter;
  });
}

@Component({
  selector: 'app-calendar',
  imports: [MatButtonModule, MatIconButton, MatIcon, PageHeader, EmptyState],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
})
export class Calendar implements OnInit {
  private eventService = inject(EventService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private loadSubscription?: Subscription;

  readonly weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  readonly month = signal(DateTime.now().setLocale('it').startOf('month'));
  readonly selectedDay = signal<DateTime | null>(null);
  readonly monthLabel = computed(() => {
    const label = this.month().toFormat('LLLL yyyy');
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  readonly weeks = computed<CalendarDay[][]>(() => {
    const month = this.month();
    const events = this.eventService.events();
    const today = DateTime.now().startOf('day').toMillis();
    const { start, end } = gridRange(month);
    const days: CalendarDay[] = [];
    for (let date = start; date.toMillis() < end.toMillis(); date = date.plus({ days: 1 })) {
      const dayEvents = eventsOn(events, date);
      const visible = dayEvents.slice(0, MAX_CHIPS);
      days.push({
        date,
        inMonth: date.month === month.month,
        isToday: date.toMillis() === today,
        events: dayEvents,
        visible,
        hidden: dayEvents.length - visible.length,
      });
    }
    return Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  });

  // Mobile list: days of the month that have at least one event
  readonly monthDays = computed(() =>
    this.weeks()
      .flat()
      .filter((d) => d.inMonth && d.events.length > 0),
  );

  readonly selectedEvents = computed(() => {
    const day = this.selectedDay();
    return day ? eventsOn(this.eventService.events(), day) : [];
  });

  ngOnInit(): void {
    this.load();
  }

  shiftMonth(months: number): void {
    this.goToMonth(this.month().plus({ months }));
  }

  goToToday(): void {
    this.goToMonth(DateTime.now().setLocale('it').startOf('month'));
  }

  openCreate(date: DateTime): void {
    this.dialog
      .open<EventDialog, EventDialogData, EventDialogResult>(EventDialog, {
        ...DIALOG_CONFIG,
        data: { date },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.action === 'save') {
          this.save(
            this.eventService.createEvent(result.event),
            'Evento creato!',
            "Impossibile creare l'evento.",
          );
        }
      });
  }

  openEvent(ev: CalendarEvent): void {
    if (this.isDistribution(ev)) {
      this.dialog
        .open(ConfirmationDialog, {
          data: {
            title: 'Distribuzione',
            message: `Distribuzione del ${DateTime.fromISO(ev.start).toFormat('dd/MM/yyyy')}. Si gestisce dalla pagina Distribuzioni.`,
            confirmLabel: 'Apri distribuzione',
          },
        })
        .afterClosed()
        .subscribe((confirmed) => {
          if (confirmed === true) this.router.navigate(['/boc/distribution']);
        });
      return;
    }

    this.dialog
      .open<EventDialog, EventDialogData, EventDialogResult>(EventDialog, {
        ...DIALOG_CONFIG,
        data: { event: ev },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.action === 'save') {
          this.save(
            this.eventService.updateEvent(result.event),
            'Evento aggiornato!',
            "Impossibile aggiornare l'evento.",
          );
        } else if (result?.action === 'delete') {
          this.confirmDelete(ev);
        }
      });
  }

  isDistribution(ev: CalendarEvent): boolean {
    return ev.distributionId != null;
  }

  timeLabel(ev: CalendarEvent): string {
    return ev.allDay || this.isDistribution(ev)
      ? 'Tutto il giorno'
      : DateTime.fromISO(ev.start).toFormat('HH:mm');
  }

  chipLabel(ev: CalendarEvent): string {
    return ev.allDay || this.isDistribution(ev)
      ? ev.title
      : `${DateTime.fromISO(ev.start).toFormat('HH:mm')} ${ev.title}`;
  }

  dayAriaLabel(day: CalendarDay): string {
    return `Nuovo evento il ${day.date.toFormat('cccc d LLLL yyyy')}`;
  }

  // Default day for "Nuovo evento": today if it is in the shown month, else the 1st
  defaultDate(): DateTime {
    const today = DateTime.now().startOf('day');
    return today.hasSame(this.month(), 'month') ? today : this.month();
  }

  private goToMonth(month: DateTime): void {
    this.month.set(month);
    this.selectedDay.set(null);
    this.load();
  }

  private load(): void {
    const { start, end } = gridRange(this.month());
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.eventService
      .fetchEvents(start.toJSDate(), end.toJSDate())
      .subscribe({ error: () => this.notify('Impossibile caricare il calendario.', SnackbarStatus.ERROR) });
  }

  private confirmDelete(ev: CalendarEvent): void {
    this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: "Eliminare l'evento?",
          message: `"${ev.title}" verrà rimosso dal calendario.`,
          confirmLabel: 'Elimina',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed === true && ev.id != null) {
          this.save(this.eventService.deleteEvent(ev.id), 'Evento eliminato.', "Impossibile eliminare l'evento.");
        }
      });
  }

  private save(request: Observable<unknown>, success: string, failure: string): void {
    request.subscribe({
      error: () => this.notify(failure, SnackbarStatus.ERROR),
      complete: () => {
        this.notify(success, SnackbarStatus.SUCCESS);
        this.load();
      },
    });
  }

  private notify(title: string, status: SnackbarStatus): void {
    this.snackBar.openFromComponent(Snackbar, { data: { title, status } });
  }
}
