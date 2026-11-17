import type { Database } from '@nozbe/watermelondb';

import type Event from '@/database/models/Event';
import {
  normalizeSearchText,
  searchEventRows,
  searchEvents,
} from '@/database/searchEvents';

type RowOverrides = Partial<Record<keyof Event, unknown>> & Record<string, unknown>;

function makeRow(overrides: RowOverrides = {}): Event {
  const start = new Date(2026, 10, 17, 10, 0, 0);
  const end = new Date(2026, 10, 17, 11, 0, 0);
  return {
    id: 'row-1',
    accountId: 'account-1',
    calendarId: 'calendar-1',
    uid: 'event-1',
    href: '/calendar-1/event-1.ics',
    summary: 'Event',
    description: undefined,
    location: undefined,
    start: start.getTime(),
    end: end.getTime(),
    allDay: false,
    color: '#0082c9',
    attendees: undefined,
    organizerEmail: undefined,
    talkUrl: undefined,
    isRecurring: false,
    rrule: undefined,
    recurrenceId: undefined,
    alarmMinutes: undefined,
    isTask: false,
    ...overrides,
  } as unknown as Event;
}

function makeTimedRow(
  uid: string,
  summary: string,
  start: Date,
  end: Date,
  overrides: RowOverrides = {},
): Event {
  return makeRow({
    uid,
    summary,
    start: start.getTime(),
    end: end.getTime(),
    ...overrides,
  });
}

describe('searchEventRows', () => {
  it('matches summary and location case-insensitively, including diacritics', () => {
    const rows = [
      makeRow({ summary: 'Café planning', location: 'Room 2' }),
      makeRow({ id: 'row-2', uid: 'event-2', summary: 'Groceries', location: 'Market' }),
    ];

    expect(searchEventRows(rows, { query: 'cafe' })).toHaveLength(1);
    expect(searchEventRows(rows, { query: 'ROOM 2' })[0].summary).toBe('Café planning');
    expect(searchEventRows(rows, { query: 'market' })[0].summary).toBe('Groceries');
  });

  it('excludes events from hidden calendars', () => {
    const rows = [
      makeRow({ uid: 'visible', calendarId: 'calendar-1', summary: 'Lunch' }),
      makeRow({ id: 'row-2', uid: 'hidden', calendarId: 'calendar-2', summary: 'Lunch' }),
    ];

    const results = searchEventRows(rows, {
      query: 'lunch',
      hiddenCalendarIds: ['calendar-2'],
    });

    expect(results.map((event) => event.uid)).toEqual(['visible']);
  });

  it('deduplicates recurring occurrence rows and keeps the next occurrence', () => {
    const now = new Date(2026, 10, 17, 10, 0, 0);
    const rows = [
      makeTimedRow(
        'standup_occ_100',
        'Standup',
        new Date(2026, 10, 17, 9, 0, 0),
        new Date(2026, 10, 17, 9, 30, 0),
        { isRecurring: true, rrule: 'FREQ=WEEKLY', recurrenceId: new Date(2026, 10, 17, 9).getTime() },
      ),
      makeTimedRow(
        'standup_occ_200',
        'Standup',
        new Date(2026, 10, 17, 11, 0, 0),
        new Date(2026, 10, 17, 11, 30, 0),
        { isRecurring: true, rrule: 'FREQ=WEEKLY', recurrenceId: new Date(2026, 10, 17, 11).getTime() },
      ),
      makeTimedRow(
        'standup_occ_300',
        'Standup',
        new Date(2026, 10, 17, 12, 0, 0),
        new Date(2026, 10, 17, 12, 30, 0),
        { isRecurring: true, rrule: 'FREQ=WEEKLY', recurrenceId: new Date(2026, 10, 17, 12).getTime() },
      ),
    ];

    const results = searchEventRows(rows, { query: 'standup', now });

    expect(results).toHaveLength(1);
    expect(results[0].uid).toBe('standup_occ_200');
  });

  it('orders upcoming matches before past matches and applies the limit', () => {
    const now = new Date(2026, 10, 17, 10, 0, 0);
    const rows = [
      makeTimedRow('past', 'Review', new Date(2026, 10, 17, 9, 0), new Date(2026, 10, 17, 9, 30)),
      makeTimedRow('next', 'Review', new Date(2026, 10, 17, 11, 0), new Date(2026, 10, 17, 11, 30)),
      makeTimedRow('later', 'Review', new Date(2026, 10, 17, 12, 0), new Date(2026, 10, 17, 12, 30)),
    ];

    const results = searchEventRows(rows, { query: 'review', now, limit: 2 });

    expect(results.map((event) => event.uid)).toEqual(['next', 'later']);
  });

  it('returns nothing for a blank query', () => {
    expect(searchEventRows([makeRow()], { query: '   ' })).toEqual([]);
  });
});

describe('searchEvents', () => {
  it('does not touch the database for a blank query', async () => {
    const get = jest.fn();
    const database = { get } as unknown as Database;

    await expect(searchEvents(database, { accountId: 'account-1', query: ' ' })).resolves.toEqual([]);
    expect(get).not.toHaveBeenCalled();
  });

  it('fetches the account events and returns ranked results', async () => {
    const rows = [makeRow({ summary: 'Lunch with Ana' })];
    const fetch = jest.fn(async () => rows);
    const query = jest.fn(() => ({ fetch }));
    const get = jest.fn(() => ({ query }));
    const database = { get } as unknown as Database;

    const results = await searchEvents(database, { accountId: 'account-1', query: 'lunch' });

    expect(get).toHaveBeenCalledWith('events');
    expect(query).toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0].summary).toBe('Lunch with Ana');
  });
});

describe('normalizeSearchText', () => {
  it('trims, collapses whitespace, lowercases and strips accents', () => {
    expect(normalizeSearchText('  Café   Central ')).toBe('cafe central');
  });
});
