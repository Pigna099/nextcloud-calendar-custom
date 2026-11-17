import type { CalendarEvent } from '@/types';

const mockGetPermissions = jest.fn();
const mockSetChannel = jest.fn();
const mockCancel = jest.fn();
const mockSchedule = jest.fn();
const mockReadUpcomingEvents = jest.fn();

jest.mock('react-native', () => ({
  __esModule: true,
  Platform: { OS: 'android' },
}));

jest.mock('expo-notifications', () => ({
  __esModule: true,
  setNotificationHandler: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  IosAuthorizationStatus: {
    NOT_DETERMINED: 0,
    DENIED: 1,
    AUTHORIZED: 2,
    PROVISIONAL: 3,
    EPHEMERAL: 4,
  },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissions(...args),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetChannel(...args),
  cancelAllScheduledNotificationsAsync: (...args: unknown[]) => mockCancel(...args),
  scheduleNotificationAsync: (...args: unknown[]) => mockSchedule(...args),
}));

jest.mock('@/features/widget/core/readEvents', () => ({
  readUpcomingEvents: (...args: unknown[]) => mockReadUpcomingEvents(...args),
}));

jest.mock('@/stores/settingsStore', () => ({
  useSettingsStore: {
    getState: () => ({ timedAlerts: [10], allDayAlerts: [1] }),
  },
}));

jest.mock('@/stores/calendarStore', () => ({
  useCalendarStore: {
    getState: () => ({ notifDisabledCalendarIds: [], hiddenCalendarIds: [] }),
  },
}));

jest.mock('@/utils/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

jest.mock('@/features/notifications/alertContent', () => ({
  alertBody: () => 'body',
}));

import { requestAlertPermission, scheduleEventAlerts } from '@/features/notifications/scheduleAlerts';

const event: CalendarEvent = {
  uid: 'event-1',
  href: '/event-1.ics',
  calendarId: 'cal-1',
  accountId: 'acc-1',
  summary: 'Planning',
  dtstart: new Date(2026, 0, 15, 10, 0),
  dtend: new Date(2026, 0, 15, 11, 0),
  allDay: false,
  color: '#0082c9',
  attendees: [],
  isRecurring: false,
  alarms: [10],
};

describe('scheduleEventAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadUpcomingEvents.mockResolvedValue([event]);
  });

  it('does not cancel existing alerts when notification permission is denied', async () => {
    mockGetPermissions.mockResolvedValue({ granted: false, ios: { status: 1 } });

    await scheduleEventAlerts(new Date(2026, 0, 15, 8, 0));

    expect(mockCancel).not.toHaveBeenCalled();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('schedules an audible alert for a future event when permission is granted', async () => {
    mockGetPermissions.mockResolvedValue({ granted: true, ios: { status: 2 } });

    await scheduleEventAlerts(new Date(2026, 0, 15, 8, 0));

    expect(mockSetChannel).toHaveBeenCalledWith(
      'event-alerts-v2',
      expect.objectContaining({ sound: 'default', importance: 4 }),
    );
    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(mockSchedule.mock.calls[0][0]).toEqual(expect.objectContaining({
      content: expect.objectContaining({
        title: 'Planning',
        sound: 'default',
        data: { uid: 'event-1' },
      }),
      trigger: expect.objectContaining({
        type: 'date',
        channelId: 'event-alerts-v2',
        date: new Date(2026, 0, 15, 9, 50),
      }),
    }));
  });

  it('requests permission only after creating the Android channel', async () => {
    const requestPermissions = jest.requireMock('expo-notifications').requestPermissionsAsync as jest.Mock;
    requestPermissions.mockResolvedValue({ granted: true, ios: { status: 2 } });

    await requestAlertPermission();

    expect(mockSetChannel).toHaveBeenCalled();
    expect(requestPermissions).toHaveBeenCalledTimes(1);
  });
});
