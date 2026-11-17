import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { msUntilNextDay, startOfToday, useToday } from '@/features/calendar/hooks/useToday';

describe('useToday', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 1, 10, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('normalizes to local midnight', () => {
    expect(startOfToday(new Date(2026, 0, 1, 23, 59, 59)).getTime())
      .toBe(new Date(2026, 0, 1).getTime());
  });

  it('knows how long is left in the day', () => {
    expect(msUntilNextDay(new Date(2026, 0, 1, 23, 59, 30))).toBe(30_000);
  });

  it('rolls over at midnight', () => {
    jest.setSystemTime(new Date(2026, 0, 1, 23, 59, 30));
    const { result } = renderHook(() => useToday());
    expect(result.current.getDate()).toBe(1);

    act(() => { jest.advanceTimersByTime(30_000); });

    expect(result.current.getDate()).toBe(2);
    expect(result.current.getMonth()).toBe(0);
  });

  it('refreshes when the app returns to the foreground after a day change', () => {
    let onChange: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((event: string, handler: (state: AppStateStatus) => void) => {
      if (event === 'change') onChange = handler;
      return { remove: jest.fn() };
    }) as unknown as typeof AppState.addEventListener);

    const { result } = renderHook(() => useToday());
    expect(result.current.getDate()).toBe(1);

    jest.setSystemTime(new Date(2026, 0, 2, 9, 0, 0));
    act(() => { onChange?.('active'); });

    expect(result.current.getDate()).toBe(2);
  });
});
