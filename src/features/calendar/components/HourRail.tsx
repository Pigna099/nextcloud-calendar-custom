import { memo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from 'expo-router';
import { useTimeFormat } from '@/hooks/useTimeFormat';
import { HOUR_RAIL_WIDTH } from '../utils/grid';
import { useCalendarDensity } from '../hooks/useCalendarDensity';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface Props {
  /** Optional so the rail can follow the clamped font scale without changing its API. */
  width?: number;
}

function HourRailImpl({ width = HOUR_RAIL_WIDTH }: Props) {
  const { colors } = useTheme();
  const { formatHour } = useTimeFormat();
  const density = useCalendarDensity();
  return (
    <View
      testID="hour-rail"
      style={{ width, zIndex: 20, backgroundColor: colors.background }}
    >
      {HOURS.map((hour) => (
        <View key={hour} testID={`hour-block-${hour}`} style={{ flex: 1 }}>
          <Text
            accessibilityRole="text"
            accessibilityLabel={formatHour(hour)}
            allowFontScaling={false}
            style={{ color: colors.textSecondary, fontSize: density.hourRailFontSize, textAlign: 'center' }}
          >
            {formatHour(hour)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const HourRail = memo(HourRailImpl);
