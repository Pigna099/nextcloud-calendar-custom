import React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from 'expo-router';
import { mix, pickInk } from '@/utils/color';
import AnimatedPressable from './AnimatedPressable';
import Typography from './Typography';

interface ChipProps {
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  rounded?: boolean;
  small?: boolean;
  activeColor?: string;
  children?: React.ReactNode;
  testID?: string;
}

function Chip({
  active = false, onPress, icon, disabled = false, fullWidth = false, rounded = false, small = false, activeColor, children, testID,
}: ChipProps) {
  const { colors, radius, dark } = useTheme();
  const activeBg = activeColor ?? colors.chipActive;
  const isThemeAccent = activeBg === colors.chipActive;
  // Selection is tonal: the accent identifies the control, but the fill stays
  // close to the surrounding surface instead of becoming a saturated block.
  const activeFill = isThemeAccent
    ? colors.primarySoft
    : mix(activeBg, colors.surface, dark ? 0.22 : 0.12);
  const activeInk = isThemeAccent ? colors.primarySoftText : pickInk(activeFill);

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      onPress={onPress}
      disabled={disabled}
      animated={!disabled}
      style={[
        styles.chip,
        small && styles.chipSmall,
        {
          borderRadius: rounded ? radius.pill : radius.sm,
          backgroundColor: active ? activeFill : colors.chip,
          borderWidth: small ? 1 : 1.5,
          borderColor: active ? activeBg : colors.borderStrong,
          opacity: disabled ? 0.5 : 1,
          flex: fullWidth ? 1 : undefined,
        },
      ]}
    >
      {icon}
      {typeof children === 'string' ? (
        <Typography variant={small ? 'caption' : 'body2'} align="center" nowrap color={active ? activeInk : 'secondary'}>
          {children}
        </Typography>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipSmall: {
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
});

export default React.memo(Chip);
