import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { readUpcomingEvents } from '@/features/widget/core/readEvents';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCalendarStore } from '@/stores/calendarStore';
import i18n from '@/utils/i18n';

import { alertBody } from './alertContent';
import { alertTimes } from './alerts';

const CHANNEL_ID = 'event-alerts-v2';
export const ALERT_HORIZON_DAYS = 45;


const MAX_SCHEDULED = 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let running: Promise<void> | null = null;
let rerun = false;

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: i18n.t('settings.notifications.channelName'),
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

function isAllowed(permission: Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>): boolean {
  if (permission.granted) return true;
  return permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    || permission.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL;
}

export async function hasAlertPermission(): Promise<boolean> {
  try {
    return isAllowed(await Notifications.getPermissionsAsync());
  } catch {
    return false;
  }
}

export async function requestAlertPermission(): Promise<boolean> {
  try {
    await ensureChannel();
    return isAllowed(await Notifications.requestPermissionsAsync());
  } catch (error) {
    console.warn('[alerts] permission request failed', error);
    return false;
  }
}

export async function ensureAlertPermission(): Promise<void> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status === 'undetermined') await requestAlertPermission();
  } catch {
    // Permission setup is best-effort; scheduling will retry on the next run.
  }
}

async function runSchedule(now: Date): Promise<void> {
  try {
    const { timedAlerts, allDayAlerts } = useSettingsStore.getState();

    await ensureChannel();
    if (!(await hasAlertPermission())) return;

    const notifDisabled = useCalendarStore.getState().notifDisabledCalendarIds;
    const events = (await readUpcomingEvents(ALERT_HORIZON_DAYS, now))
      .filter((event) => !notifDisabled.includes(event.calendarId));

    const due = events
      .flatMap((event) => alertTimes(event, timedAlerts, allDayAlerts).map((at) => ({ event, at })))
      .filter((x) => x.at.getTime() > now.getTime())
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(0, MAX_SCHEDULED);

    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const { event, at } of due) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: event.summary,
            body: alertBody(event, at),
            sound: 'default',
            data: { uid: event.uid },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: at,
            channelId: CHANNEL_ID,
          },
        });
      } catch (error) {
        console.warn('[alerts] failed to schedule one alert', error);
      }
    }
  } catch (error) {
    console.warn('[alerts] scheduling failed', error);
  } finally {
    running = null;
    if (rerun) {
      rerun = false;
      void scheduleEventAlerts(new Date());
    }
  }
}

export async function scheduleEventAlerts(now: Date = new Date()): Promise<void> {
  if (running) {
    rerun = true;
    return running;
  }
  running = runSchedule(now);
  return running;
}
