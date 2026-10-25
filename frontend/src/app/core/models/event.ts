export interface CalendarEvent {
  id?: number;
  title: string;
  description?: string | null;
  // ISO UTC strings from the API
  start: string;
  end?: string | null;
  allDay: boolean;
  // Set when the event mirrors a distribution (read-only from the calendar)
  distributionId?: number | null;
}
