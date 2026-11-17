import { renderHook, act } from '@testing-library/react-native';
import { useCalendarNavigation } from '../../src/features/calendar/hooks/useCalendarNavigation';
import { useCalendarStore } from '@/stores/calendarStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('useCalendarNavigation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    act(() => { useCalendarStore.setState({ viewMode: 'week' }); });
  });
  afterEach(() => { jest.useRealTimers(); });

  it('page change updates date immediately but debounces fetchDate to the last value', () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const d1 = new Date('2026-03-10T00:00:00Z');
    const d2 = new Date('2026-03-17T00:00:00Z');

    act(() => { result.current.onPageChange(d1); });
    expect(result.current.date).toEqual(d1);
    expect(result.current.fetchDate).not.toEqual(d1);

    act(() => { result.current.onPageChange(d2); });
    expect(result.current.date).toEqual(d2);

    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current.fetchDate).toEqual(d2);
  });

  it('month paging updates the visible month without selecting its first day', () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const selectedBefore = result.current.date;
    const targetMonth = new Date(2026, 6, 1);

    act(() => { result.current.onMonthPageChange(targetMonth); });

    expect(result.current.date).toBe(selectedBefore);
    expect(result.current.visibleMonth.getMonth()).toBe(targetMonth.getMonth());
    expect(result.current.visibleMonth.getFullYear()).toBe(targetMonth.getFullYear());
    expect(result.current.fetchDate).not.toEqual(targetMonth);

    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current.fetchDate).toEqual(targetMonth);
  });

  it('setDate updates fetchDate immediately and cancels a pending page change', () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const swiped = new Date('2026-04-01T00:00:00Z');
    const tapped = new Date('2026-05-15T00:00:00Z');

    act(() => { result.current.onPageChange(swiped); });
    act(() => { result.current.setDate(tapped); });
    expect(result.current.fetchDate).toEqual(tapped);

    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current.fetchDate).toEqual(tapped);
  });

  it('a page change leaves the anchor alone so the pager keeps its index', () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const before = result.current.anchorDate;

    act(() => { result.current.onPageChange(new Date('2026-06-01T00:00:00Z')); });

    expect(result.current.anchorDate).toBe(before);
  });

  it('setDate leaves the anchor put and publishes the jump instead', () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const anchorBefore = result.current.anchorDate;
    const nonceBefore = result.current.jump.nonce;
    const target = new Date('2026-09-09T00:00:00Z');

    act(() => { result.current.setDate(target); });

    expect(result.current.anchorDate).toBe(anchorBefore);
    expect(result.current.date).toEqual(target);
    expect(result.current.jump.nonce).toBe(nonceBefore + 1);
    expect(result.current.jump.target).toEqual(target);
  });

  it('a swipe does not publish a jump', () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const jumpBefore = result.current.jump;

    act(() => { result.current.onPageChange(new Date('2026-06-01T00:00:00Z')); });

    expect(result.current.jump).toBe(jumpBefore);
  });

  it('switchMode re-anchors, because the page span changed', () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const swiped = new Date('2026-07-04T00:00:00Z');

    act(() => { result.current.onPageChange(swiped); });
    act(() => { result.current.switchMode('day'); });

    expect(result.current.viewMode).toBe('day');
    expect(result.current.anchorDate).toEqual(swiped);
  });

  it('switching from a swiped month focuses the visible month, not a stale day', () => {
    act(() => { useCalendarStore.setState({ viewMode: 'month' }); });
    const { result } = renderHook(() => useCalendarNavigation());
    const july = new Date(2026, 6, 1);

    act(() => { result.current.onMonthPageChange(july); });
    act(() => { result.current.switchMode('day'); });

    expect(result.current.viewMode).toBe('day');
    expect(result.current.anchorDate).toEqual(july);
    expect(result.current.date).toEqual(july);
  });

  it('selecting the already active month mode does not move the selected day', () => {
    act(() => { useCalendarStore.setState({ viewMode: 'month' }); });
    const { result } = renderHook(() => useCalendarNavigation());
    const before = result.current.date;
    const jumpBefore = result.current.jump;

    act(() => { result.current.switchMode('month'); });

    expect(result.current.date).toBe(before);
    expect(result.current.jump).toBe(jumpBefore);
  });

  it('in schedule mode, agenda scrolling debounces fetchDate to the visible date', () => {
    act(() => { useCalendarStore.setState({ viewMode: 'schedule' }); });
    const { result } = renderHook(() => useCalendarNavigation());
    const past = new Date('2026-01-15T00:00:00Z');

    act(() => { result.current.setAgendaVisibleDate(past); });
    expect(result.current.fetchDate).not.toEqual(past);

    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current.fetchDate).toEqual(past);
  });

  it('outside schedule mode, the agenda visible date does not move fetchDate', () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const before = result.current.fetchDate;

    act(() => { result.current.setAgendaVisibleDate(new Date('2026-01-15T00:00:00Z')); });
    act(() => { jest.advanceTimersByTime(300); });

    expect(result.current.fetchDate).toBe(before);
  });

  it('goToday returns the date to now and publishes it as a jump', () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const anchorBefore = result.current.anchorDate;

    act(() => { result.current.onPageChange(new Date('2026-01-01T00:00:00Z')); });
    act(() => { result.current.goToday(); });

    const today = new Date().toDateString();
    expect(result.current.date.toDateString()).toBe(today);
    expect(result.current.jump.target.toDateString()).toBe(today);
    expect(result.current.anchorDate).toBe(anchorBefore);
  });
});
