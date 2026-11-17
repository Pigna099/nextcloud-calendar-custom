import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { msUntilNextMinute, useNow } from '@/features/calendar/hooks/useNow';

describe('useNow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 1, 10, 15, 15));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('aligns its ticks to the next minute boundary', () => {
    expect(msUntilNextMinute(new Date(2026, 0, 1, 10, 15, 0).getTime())).toBe(60_000);
    expect(msUntilNextMinute(new Date(2026, 0, 1, 10, 15, 15).getTime())).toBe(45_000);
    expect(msUntilNextMinute(new Date(2026, 0, 1, 10, 15, 30).getTime())).toBe(30_000);
  });

  it('advances the clock at the next minute', () => {
    const { result } = renderHook(() => useNow());
    expect(result.current.getMinutes()).toBe(15);

    act(() => { jest.advanceTimersByTime(45_000); });

    expect(result.current.getMinutes()).toBe(16);
  });

  it('advances the clock at the next minute', () => {
    const { result } = renderHook(() => useNow());
    expect(result.current.getMinutes()).toBe(15);

    act(() => { jest.advanceTimersByTime(45_000); });

    expect(result.current.getMinutes()).toBe(16);
  });

  it('refreshes immediately when the app returns to the foreground', () => {
    let onChange: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((event: string, handler: (state: AppStateStatus) => void) => {
      if (event === 'change') onChange = handler;
      return { remove: jest.fn() };
    }) as unknown as typeof AppState.addEventListener);

    const { result } = renderHook(() => useNow());
    const before = result.current;

    jest.setSystemTime(new Date(2026, 0, 1, 12, 0, 0));
    act(() => { onChange?.('active'); });

    expect(result.current.getTime()).toBeGreaterThan(before.getTime());
    expect(result.current.getHours()).toBe(12);
  });
});
