import React from 'react';
import { Switch, SwitchProps } from 'react-native';
import { useTheme } from 'expo-router';


function Toggle({ value, onValueChange, disabled, ...rest }: SwitchProps) {
  const { colors } = useTheme();
  return (
    <Switch
      {...rest}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.borderStrong, true: colors.primary }}
      thumbColor={value ? colors.onPrimary : colors.surfaceRaised}
      ios_backgroundColor={colors.borderStrong}
    />
  );
}

export default React.memo(Toggle);
