import { act, renderHook, waitFor } from '@testing-library/react-native';

import { searchEvents } from '@/database/searchEvents';
import {
  EVENT_SEARCH_DEBOUNCE_MS,
  useEventSearch,
} from '@/features/calendar/hooks/useEventSearch';
import { useAccountStore } from '@/stores/accountStore';
import { useCalendarStore } from '@/stores/calendarStore';
import type { CalendarEvent } from '@/types';

jest.mock('@/database/DatabaseProvider', () => {
  const database = {};
  return { useDatabase: () => database };
});

jest.mock('@/database/searchEvents', () => ({
  EVENT_SEARCH_LIMIT: 50,
  searchEvents: jest.fn(),
}));

const mockedSearchEvents = searchEvents as jest.MockedFunction<typeof searchEvents>;

const event: CalendarEvent = {
  uid: 'event-1',
  href: '/calendar-1/event-1.ics',
  calendarId: 'calendar-1',
  accountId: 'account-1',
  summary: 'Team meeting',
  location: 'Room 1',
  dtstart: new Date(2026, 10, 17, 11, 0, 0),
  dtend: new Date(2026, 10, 17, 12, 0, 0),
  allDay: false,
  color: '#0082c9',
  attendees: [],
  isRecurring: false,
};

describe('useEventSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    useAccountStore.setState({ activeAccountId: 'account-1' });
    useCalendarStore.setState({ hiddenCalendarIds: [] });
    mockedSearchEvents.mockReset();
    mockedSearchEvents.mockResolvedValue([event]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces before querying the local database', async () => {
    const { result } = renderHook(() => useEventSearch('team'));

    expect(result.current.loading).toBe(true);
    expect(mockedSearchEvents).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(EVENT_SEARCH_DEBOUNCE_MS - 1); });
    expect(mockedSearchEvents).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(1); });

    await waitFor(() => expect(result.current.results).toEqual([event]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedSearchEvents).toHaveBeenCalledTimes(1);
    expect(mockedSearchEvents).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        accountId: 'account-1',
        query: 'team',
        hiddenCalendarIds: [],
        limit: 50,
      }),
    );
    expect(result.current.error).toBe(false);
  });

  it('does not query while disabled, without an account, or for a blank query', () => {
    const { rerender } = renderHook(
      ({ query, enabled }: { query: string; enabled: boolean }) =>
        useEventSearch(query, { enabled }),
      { initialProps: { query: 'team', enabled: false } },
    );

    act(() => { jest.advanceTimersByTime(EVENT_SEARCH_DEBOUNCE_MS * 2); });
    expect(mockedSearchEvents).not.toHaveBeenCalled();

    act(() => { useAccountStore.setState({ activeAccountId: null }); });
    rerender({ query: 'team', enabled: true });
    act(() => { jest.advanceTimersByTime(EVENT_SEARCH_DEBOUNCE_MS * 2); });
    expect(mockedSearchEvents).not.toHaveBeenCalled();

    act(() => { useAccountStore.setState({ activeAccountId: 'account-1' }); });
    rerender({ query: '   ', enabled: true });
    act(() => { jest.advanceTimersByTime(EVENT_SEARCH_DEBOUNCE_MS * 2); });
    expect(mockedSearchEvents).not.toHaveBeenCalled();
  });

  it('passes the hidden calendars so search matches the visible calendar views', async () => {
    useCalendarStore.setState({ hiddenCalendarIds: ['calendar-hidden'] });
    const { result } = renderHook(() => useEventSearch('team'));

    act(() => { jest.advanceTimersByTime(EVENT_SEARCH_DEBOUNCE_MS); });

    await waitFor(() => expect(result.current.results).toEqual([event]));
    expect(mockedSearchEvents).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ hiddenCalendarIds: ['calendar-hidden'] }),
    );
  });

  it('surfaces a local search failure without crashing', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockedSearchEvents.mockRejectedValue(new Error('database unavailable'));

    const { result } = renderHook(() => useEventSearch('team'));
    act(() => { jest.advanceTimersByTime(EVENT_SEARCH_DEBOUNCE_MS); });

    await waitFor(() => expect(result.current.error).toBe(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results).toEqual([]);
    warn.mockRestore();
  });
});
