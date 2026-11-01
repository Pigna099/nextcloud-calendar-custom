import { applyCalendarPresentation } from '@/features/calendar/utils/calendarPresentation';
import type { CalendarEvent, CalendarMeta } from '@/types';

const baseCalendar: CalendarMeta = {
  id: 'c1',
  accountId: 'a1',
  displayName: 'Work',
  color: '#00aa00',
  ctag: '1',
  url: '/calendars/a1/c1/',
  slug: 'work',
};

const baseEvent: CalendarEvent = {
  uid: 'e1',
  href: '/calendars/a1/c1/e1.ics',
  calendarId: 'c1',
  accountId: 'a1',
  summary: 'Meeting',
  dtstart: new Date(2026, 10, 1, 9, 0),
  dtend: new Date(2026, 10, 1, 10, 0),
  allDay: false,
  color: '#0000ff',
  attendees: [],
  isRecurring: false,
};

describe('applyCalendarPresentation', () => {
  it('uses the current calendar color for cached event rows', () => {
    const [event] = applyCalendarPresentation([baseEvent], [baseCalendar], []);
    expect(event.color).toBe('#00aa00');
  });

  it('keeps the cached event color when the calendar is not available', () => {
    const [event] = applyCalendarPresentation([baseEvent], [], []);
    expect(event.color).toBe('#0000ff');
  });

  it('filters hidden calendars', () => {
    expect(applyCalendarPresentation([baseEvent], [baseCalendar], ['c1'])).toEqual([]);
  });

  it('marks events from read-only calendars', () => {
    const [event] = applyCalendarPresentation(
      [baseEvent],
      [{ ...baseCalendar, isReadOnly: true }],
      [],
    );
    expect(event.readOnly).toBe(true);
  });
});
