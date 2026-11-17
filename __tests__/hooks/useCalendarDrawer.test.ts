import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';
import { useCalendarDrawer } from '@/features/calendar/hooks/useCalendarDrawer';
import { useSettingsStore } from '@/stores/settingsStore';

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
}));

describe('useCalendarDrawer', () => {
  beforeEach(() => {
    useSettingsStore.setState({ reduceMotion: false });
    jest.restoreAllMocks();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    useSettingsStore.setState({ reduceMotion: false });
    jest.restoreAllMocks();
  });

  it('animates open and close when motion is allowed', () => {
    const parallel = jest.spyOn(Animated, 'parallel').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    } as unknown as Animated.CompositeAnimation);

    const { result } = renderHook(() => useCalendarDrawer());
    act(() => { result.current.openDrawer(); });

    expect(parallel).toHaveBeenCalledTimes(1);

    act(() => { result.current.closeDrawer(); });
    expect(parallel).toHaveBeenCalledTimes(2);
  });

  it('jumps straight to the open position when reduce motion is on', () => {
    useSettingsStore.setState({ reduceMotion: true });
    const parallel = jest.spyOn(Animated, 'parallel');

    const { result } = renderHook(() => useCalendarDrawer());
    act(() => { result.current.openDrawer(); });

    expect(parallel).not.toHaveBeenCalled();
    expect((result.current.drawerAnim as unknown as { __getValue: () => number }).__getValue()).toBe(0);
    expect((result.current.overlayAnim as unknown as { __getValue: () => number }).__getValue()).toBe(1);
    expect(result.current.drawerOpen).toBe(true);
  });

  it('jumps straight to the closed position when reduce motion is on', () => {
    useSettingsStore.setState({ reduceMotion: true });
    const parallel = jest.spyOn(Animated, 'parallel');

    const { result } = renderHook(() => useCalendarDrawer());
    act(() => { result.current.openDrawer(); });
    act(() => { result.current.closeDrawer(); });

    expect(parallel).not.toHaveBeenCalled();
    expect((result.current.drawerAnim as unknown as { __getValue: () => number }).__getValue())
      .toBeCloseTo(-result.current.drawerWidth);
    expect((result.current.overlayAnim as unknown as { __getValue: () => number }).__getValue()).toBe(0);
    expect(result.current.drawerOpen).toBe(false);
  });
});
