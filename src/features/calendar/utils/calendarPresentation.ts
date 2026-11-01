import { normalizeEvents } from '@/utils/normalizeEvent';
import type { CalendarEvent, CalendarMeta } from '@/types';

/**
 * Applies the current calendar metadata to events at render time. Event rows
 * cache the color they had when they were synced, so a calendar color change in
 * Nextcloud would otherwise leave old event labels/details on screen until each
 * event is re-fetched.
 */
export function applyCalendarPresentation(
  events: CalendarEvent[],
  calendars: CalendarMeta[],
  hiddenCalendarIds: readonly string[],
): CalendarEvent[] {
  const nonEditableCalendarIds = new Set(
    calendars.filter((c) => c.isReadOnly || c.isSubscribed).map((c) => c.id),
  );
  const colorByCalendar = new Map(calendars.map((c) => [c.id, c.color]));

  return normalizeEvents(
    events.filter((e) => !hiddenCalendarIds.includes(e.calendarId)),
  ).map((e) => {
    const color = e.colorOverride
      ? e.color
      : (colorByCalendar.get(e.calendarId) ?? e.color);
    const readOnly = nonEditableCalendarIds.has(e.calendarId);
    if (color === e.color && !readOnly) return e;
    return { ...e, color, ...(readOnly ? { readOnly: true } : {}) };
  });
}
