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
  // Fixed keys from event-style.ts; null/undefined means default
  icon?: string | null;
  color?: string | null;
}
