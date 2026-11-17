import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReduceMotion } from '@/features/calendar/hooks/useReduceMotion';
import { useSettingsStore } from '@/stores/settingsStore';

type ReduceMotionListener = (enabled: boolean) => void;

describe('useReduceMotion', () => {
  beforeEach(() => {
    useSettingsStore.setState({ reduceMotion: false });
    jest.restoreAllMocks();
  });

  afterEach(() => {
    useSettingsStore.setState({ reduceMotion: false });
    jest.restoreAllMocks();
  });

  it('reports the in-app preference immediately', () => {
    useSettingsStore.setState({ reduceMotion: true });
    const { result } = renderHook(() => useReduceMotion());
    expect(result.current).toBe(true);
  });

  it('reports the OS preference once it is read', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { result } = renderHook(() => useReduceMotion());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('follows OS changes at runtime', async () => {
    let listener: ReduceMotionListener | undefined;
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise<boolean>(() => {}));
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((
      event: string,
      handler: ReduceMotionListener,
    ) => {
      if (event === 'reduceMotionChanged') listener = handler;
      return { remove: jest.fn() };
    }) as unknown as typeof AccessibilityInfo.addEventListener);

    const { result } = renderHook(() => useReduceMotion());
    expect(result.current).toBe(false);

    act(() => { listener?.(true); });

    expect(result.current).toBe(true);
  });
});
