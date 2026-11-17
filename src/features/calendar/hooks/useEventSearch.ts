import { useEffect, useRef, useState } from 'react';

import { useDatabase } from '@/database/DatabaseProvider';
import { EVENT_SEARCH_LIMIT, searchEvents } from '@/database/searchEvents';
import { useAccountStore } from '@/stores/accountStore';
import { useCalendarStore } from '@/stores/calendarStore';
import type { CalendarEvent } from '@/types';

export const EVENT_SEARCH_DEBOUNCE_MS = 250;

export interface UseEventSearchOptions {
  /** Allows the sheet to stop querying as soon as it closes. */
  enabled?: boolean;
  limit?: number;
  debounceMs?: number;
}

export interface UseEventSearchResult {
  results: CalendarEvent[];
  loading: boolean;
  error: boolean;
}

export function useEventSearch(
  query: string,
  options: UseEventSearchOptions = {},
): UseEventSearchResult {
  const {
    enabled = true,
    limit = EVENT_SEARCH_LIMIT,
    debounceMs = EVENT_SEARCH_DEBOUNCE_MS,
  } = options;

  const database = useDatabase();
  const accountId = useAccountStore((state) => state.activeAccountId);
  const hiddenCalendarIds = useCalendarStore((state) => state.hiddenCalendarIds);

  const [results, setResults] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const term = query.trim();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!enabled || !accountId || !term) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setResults([]);

    const timer = setTimeout(() => {
      searchEvents(database, {
        accountId,
        query: term,
        hiddenCalendarIds,
        limit,
      })
        .then((next) => {
          if (cancelled || requestRef.current !== requestId) return;
          setResults(next);
        })
        .catch((searchError: unknown) => {
          console.warn('[useEventSearch] search failed:', String(searchError));
          if (cancelled || requestRef.current !== requestId) return;
          setResults([]);
          setError(true);
        })
        .finally(() => {
          if (cancelled || requestRef.current !== requestId) return;
          setLoading(false);
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [accountId, database, debounceMs, enabled, hiddenCalendarIds, limit, query]);

  return { results, loading, error };
}
