import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * True when either the in-app "Reduce motion" preference or the operating
 * system's reduce-motion setting asks for animations to be suppressed.
 */
export function useReduceMotion(): boolean {
  const appReduceMotion = useSettingsStore((state) => state.reduceMotion);
  const [osReduceMotion, setOsReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    const update = (value?: boolean) => {
      if (mounted && typeof value === 'boolean') setOsReduceMotion(value);
    };

    if (typeof AccessibilityInfo.isReduceMotionEnabled === 'function') {
      try {
        const result = AccessibilityInfo.isReduceMotionEnabled();
        if (result && typeof result.then === 'function') {
          void result.then(update).catch(() => {});
        }
      } catch {
        // Platform without a working reduce-motion query; treat it as off.
      }
    }

    const subscription = typeof AccessibilityInfo.addEventListener === 'function'
      ? AccessibilityInfo.addEventListener('reduceMotionChanged', update)
      : undefined;

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return appReduceMotion || osReduceMotion;
}
