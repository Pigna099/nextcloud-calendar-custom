import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/** Midnight at the start of the current local day. */
export function startOfToday(from: Date = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth(), from.getDate());
}

/** Milliseconds until the next local midnight. */
export function msUntilNextDay(from: Date = new Date()): number {
  const nextMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
  return Math.max(1000, nextMidnight.getTime() - from.getTime());
}

/**
 * Today's date, refreshed at local midnight and when the app returns to the
 * foreground. Used for "is this day today" decisions so they do not require a
 * per-minute clock.
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => startOfToday());

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = () => {
      setToday((previous) => {
        const next = startOfToday();
        return previous.getTime() === next.getTime() ? previous : next;
      });
    };

    const schedule = () => {
      if (cancelled) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (cancelled) return;
        refresh();
        schedule();
      }, msUntilNextDay());
    };

    schedule();

    const onAppStateChange = (state: AppStateStatus) => {
      if (cancelled || state !== 'active') return;
      refresh();
      schedule();
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      subscription?.remove?.();
    };
  }, []);

  return today;
}
