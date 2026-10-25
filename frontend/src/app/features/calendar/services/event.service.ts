import { inject, Injectable, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { HttpHandler } from '../../../core/http/httpHandler';
import { CalendarEvent } from '../../../core/models/event';

@Injectable({ providedIn: 'root' })
export class EventService {
  private httpHandler = inject(HttpHandler);

  private eventsSignal = signal<CalendarEvent[]>([]);
  private loadingSignal = signal<boolean>(false);

  public events = this.eventsSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();

  fetchEvents(from: Date, to: Date) {
    this.loadingSignal.set(true);
    const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    return this.httpHandler.get<CalendarEvent[]>(`api/event?${params}`).pipe(
      tap((events) => this.eventsSignal.set(events)),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  createEvent(event: CalendarEvent) {
    return this.httpHandler.post<CalendarEvent>('api/event', event);
  }

  updateEvent(event: CalendarEvent) {
    return this.httpHandler.put<CalendarEvent>(`api/event/${event.id}`, event);
  }

  deleteEvent(id: number) {
    return this.httpHandler.delete<void>(`api/event/${id}`);
  }
}
