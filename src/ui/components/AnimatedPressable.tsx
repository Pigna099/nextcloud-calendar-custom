import React, { useEffect } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { haptic } from '@/utils/haptics';
import { useReduceMotion } from '@/features/calendar/hooks/useReduceMotion';

const AnimatedPressableBase = Reanimated.createAnimatedComponent(Pressable);

type AnimatedPressableProps = PressableProps & {
  scaleTo?: number;
  opacityTo?: number;
  animated?: boolean;
  hapticFeedback?: Haptics.ImpactFeedbackStyle;
};

function AnimatedPressable({
  scaleTo = 0.97,
  opacityTo,
  animated = true,
  hapticFeedback,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();

  const shouldAnimate = animated && !reduceMotion;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // If reduce-motion is switched on mid-press, do not leave the button stuck
  // at its pressed scale.
  useEffect(() => {
    if (reduceMotion) scale.value = 1;
  }, [reduceMotion, scale]);

  return (
    <AnimatedPressableBase
      {...rest}
      style={[rest.style as object, animatedStyle]}
      onPressIn={(e) => {
        if (shouldAnimate) scale.value = withTiming(scaleTo, { duration: 100 });
        if (hapticFeedback) haptic(hapticFeedback);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (shouldAnimate) scale.value = withTiming(1, { duration: 100 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressableBase>
  );
}

export default React.memo(AnimatedPressable);
