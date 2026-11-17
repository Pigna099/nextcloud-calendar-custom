import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAccountStore } from '@/stores/accountStore';
import { EVENT_OBSERVED_COLUMNS } from '@/database/observedColumns';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { observeAgendaEventsQuery } from '@/features/widget/core/readEvents';

import { ALERT_HORIZON_DAYS, ensureAlertPermission, scheduleEventAlerts } from './scheduleAlerts';

export function useEventAlerts(): void {
  const activeAccountId = useAccountStore((s) => s.activeAccountId);
  const timedAlerts = useSettingsStore((s) => s.timedAlerts);
  const allDayAlerts = useSettingsStore((s) => s.allDayAlerts);
  const notifDisabledCalendarIds = useCalendarStore((s) => s.notifDisabledCalendarIds);
  const hiddenCalendarIds = useCalendarStore((s) => s.hiddenCalendarIds);

  useEffect(() => {
    if (!activeAccountId) return;

    void (async () => {
      await ensureAlertPermission();
      await scheduleEventAlerts();
    })();

    const sub = observeAgendaEventsQuery(activeAccountId, ALERT_HORIZON_DAYS)
      .observeWithColumns(EVENT_OBSERVED_COLUMNS)
      .subscribe(() => {
        void scheduleEventAlerts();
      });

    const onAppState = (status: AppStateStatus) => {
      if (status === 'active') void scheduleEventAlerts();
    };
    const appSub = AppState.addEventListener('change', onAppState);

    return () => {
      sub.unsubscribe();
      appSub.remove();
    };
  }, [
    activeAccountId, timedAlerts, allDayAlerts,
    notifDisabledCalendarIds, hiddenCalendarIds,
  ]);
}
