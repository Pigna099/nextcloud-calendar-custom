import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export const MINUTE_MS = 60 * 1000;

/** Milliseconds until the next whole minute. */
export function msUntilNextMinute(from: number = Date.now()): number {
  const remainder = from % MINUTE_MS;
  return remainder === 0 ? MINUTE_MS : MINUTE_MS - remainder;
}

/**
 * A clock for the "now" indicator. Watches the wall clock every minute instead
 * of running a fixed-rate interval, so the line moves at :00 rather than at
 * whatever offset the component happened to mount. Also refreshes as soon as
 * the app returns to the foreground, since JS timers are suspended while the
 * app is in the background.
 *
 * Only the component using this hook re-renders each minute; the surrounding
 * grid page and its events stay untouched.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if (cancelled) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (cancelled) return;
        setNow(new Date());
        schedule();
      }, msUntilNextMinute());
    };

    schedule();

    const onAppStateChange = (state: AppStateStatus) => {
      if (cancelled || state !== 'active') return;
      setNow(new Date());
      schedule();
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      subscription?.remove?.();
    };
  }, []);

  return now;
}
