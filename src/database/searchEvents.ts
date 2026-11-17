import { Q } from '@nozbe/watermelondb';
import type { Database } from '@nozbe/watermelondb';

import type { CalendarEvent } from '@/types';

import { mapEventToShared } from './mappers/event';
import Event from './models/Event';
import { seriesBaseUid } from './sync';

export const EVENT_SEARCH_LIMIT = 50;

export interface EventSearchOptions {
  accountId: string;
  query: string;
  hiddenCalendarIds?: readonly string[];
  limit?: number;
  now?: Date;
}

/**
 * Searches local WatermelonDB rows for one account.
 *
 * The app only keeps a bounded local window of events (see `expansionHorizon`),
 * so we deliberately fetch the account's rows and filter/rank in JavaScript
 * instead of relying on SQL `LIKE`/OR predicates. Case folding for non-ASCII
 * text varies between SQLite builds and WatermelonDB query versions, while the
 * local cache is already bounded. Filtering locally also means search works
 * offline, exactly like the calendar views.
 *
 * Hidden calendars are excluded, matching the rendering convention. Notification
 * preferences are intentionally not consulted: muting a calendar's alerts must
 * not make its events unsearchable.
 */
export async function searchEvents(
  database: Database,
  options: EventSearchOptions,
): Promise<CalendarEvent[]> {
  const term = normalizeSearchText(options.query);
  if (!options.accountId || !term) return [];

  const rows = await database
    .get<Event>('events')
    .query(Q.where('account_id', options.accountId))
    .fetch();

  return searchEventRows(rows, options);
}

/** Lower-cases and strips diacritics so "Cafe" matches "Café". */
export function normalizeSearchText(value: string): string {
  // `String.prototype.normalize` is missing on some older Hermes builds; the
  // guard keeps accents searchable where available without crashing otherwise.
  const decomposed = typeof value.normalize === 'function' ? value.normalize('NFD') : value;
  return decomposed
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Candidate {
  event: CalendarEvent;
  score: number;
}

/**
 * Pure, synchronous part of the search, exported for tests and reuse.
 */
export function searchEventRows(
  rows: readonly Event[],
  options: Omit<EventSearchOptions, 'accountId'> & { accountId?: string },
): CalendarEvent[] {
  const term = normalizeSearchText(options.query);
  if (!term) return [];

  const tokens = term.split(' ').filter(Boolean);
  const hidden = new Set(options.hiddenCalendarIds ?? []);
  const limit = Math.max(0, Math.floor(options.limit ?? EVENT_SEARCH_LIMIT));
  const nowMs = (options.now ?? new Date()).getTime();
  const bySeries = new Map<string, Candidate>();

  for (const row of rows) {
    if (row.accountId && options.accountId && row.accountId !== options.accountId) continue;
    if (hidden.has(row.calendarId)) continue;

    const summary = normalizeSearchText(row.summary ?? '');
    const location = normalizeSearchText(row.location ?? '');
    const haystack = `${summary} ${location}`;
    if (!tokens.every((token) => haystack.includes(token))) continue;

    const candidate: Candidate = {
      event: mapEventToShared(row),
      score: relevanceScore(term, summary, location),
    };
    const key = seriesKey(row);
    const existing = bySeries.get(key);
    bySeries.set(key, existing ? prefer(existing, candidate, nowMs) : candidate);
  }

  const ranked = [...bySeries.values()].sort((a, b) => compareCandidates(a, b, nowMs));
  return ranked.slice(0, limit).map((candidate) => candidate.event);
}

function relevanceScore(term: string, summary: string, location: string): number {
  if (summary === term) return 0;
  if (summary.startsWith(term)) return 1;
  if (summary.includes(term)) return 2;
  if (location === term) return 3;
  if (location.includes(term)) return 4;
  return 5;
}

function seriesKey(row: Event): string {
  // Recurring events are stored as expanded occurrence rows with a
  // `<uid>_occ_<timestamp>` uid. `seriesBaseUid` is the established helper used
  // by event writes to find every occurrence, so it is the safe identity here.
  const uid = row.uid ?? '';
  const base = row.isRecurring || row.rrule != null || row.recurrenceId != null
    || uid.includes('_occ_')
    ? seriesBaseUid(uid)
    : uid;
  return `${row.accountId ?? ''}\u0000${row.calendarId}\u0000${base}`;
}

function isUpcoming(event: CalendarEvent, nowMs: number): boolean {
  return event.dtend.getTime() >= nowMs;
}

/** Keeps the most relevant occurrence, preferring the next one in time. */
function prefer(a: Candidate, b: Candidate, nowMs: number): Candidate {
  if (a.score !== b.score) return a.score < b.score ? a : b;

  const aUpcoming = isUpcoming(a.event, nowMs);
  const bUpcoming = isUpcoming(b.event, nowMs);
  if (aUpcoming !== bUpcoming) return aUpcoming ? a : b;

  const aStart = a.event.dtstart.getTime();
  const bStart = b.event.dtstart.getTime();
  if (aStart === bStart) return a;
  return aUpcoming ? (aStart < bStart ? a : b) : (aStart > bStart ? a : b);
}

function compareCandidates(a: Candidate, b: Candidate, nowMs: number): number {
  const aUpcoming = isUpcoming(a.event, nowMs);
  const bUpcoming = isUpcoming(b.event, nowMs);
  if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;

  if (a.score !== b.score) return a.score - b.score;

  const delta = a.event.dtstart.getTime() - b.event.dtstart.getTime();
  if (delta !== 0) return aUpcoming ? delta : -delta;

  const bySummary = (a.event.summary ?? '').localeCompare(b.event.summary ?? '');
  if (bySummary !== 0) return bySummary;
  return a.event.uid.localeCompare(b.event.uid);
}
