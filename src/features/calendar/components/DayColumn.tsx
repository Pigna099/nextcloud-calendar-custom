import { memo, useCallback, useMemo, useRef } from 'react';
import { View, Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';
import { useTheme } from 'expo-router';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { eventPositionStyle, nowTopPct } from '../utils/grid';
import type { GridEvent } from '../utils/toGridEvents';
import type { PositionedEvent } from '../utils/eventLayout';
import { useNow } from '../hooks/useNow';
import { TimeGridEvent } from './TimeGridEvent';

/** Movement (dp) beyond which a touch is a swipe, not a tap. */
const TAP_SLOP = 10;

interface Props {
  date: Date;
  positioned: PositionedEvent[];
  hourRowHeight: number;
  isToday?: boolean;
  fontScale?: number;
  /** Supplied by TimeGridPage so every column shares one reduce-motion subscription. */
  reduceMotion?: boolean;
  onPressSlot: (d: Date) => void;
  onPressEvent: (e: GridEvent) => void;
  dimmedUid?: string;
}

function DayColumnImpl({
  date, positioned, hourRowHeight, isToday = false, fontScale = 1, reduceMotion = false,
  onPressSlot, onPressEvent, dimmedUid,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const columnStyle = useMemo(
    () => [styles.column, { borderLeftWidth: 1, borderLeftColor: colors.border }],
    [colors.border]
  );

  // A fast fling through the pager can reach this surface as a press, released far from where it
  // started (with a meaningless locationY): only a touch that stayed put is a tap.
  const pressIn = useRef<GestureResponderEvent['nativeEvent'] | null>(null);
  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    pressIn.current = e.nativeEvent;
  }, []);

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      const start = pressIn.current ?? e.nativeEvent;
      pressIn.current = null;
      const moved = Math.hypot(e.nativeEvent.pageX - start.pageX, e.nativeEvent.pageY - start.pageY);
      if (moved > TAP_SLOP) return;
      const raw = Math.floor(start.locationY / hourRowHeight);
      const hour = Math.min(23, Math.max(0, raw));
      onPressSlot(dayjs(date).hour(hour).minute(0).second(0).millisecond(0).toDate());
    },
    [date, hourRowHeight, onPressSlot]
  );

  return (
    <View testID="day-column" style={columnStyle}>
      <Pressable
        testID="day-column-surface"
        accessibilityRole="button"
        accessibilityLabel={dayjs(date).format('dddd, D MMMM')}
        accessibilityHint={t('event.newEvent')}
        style={StyleSheet.absoluteFill}
        onPressIn={handlePressIn}
        onPress={handlePress}
      />

      {positioned.map(({ event, leftPct, widthPct, zIndex }, i) => {
        const { top, height } = eventPositionStyle(event.start, event.end);
        return (
          <TimeGridEvent
            key={`${event._event.uid}-${event.start.getTime()}-${i}`}
            event={event}
            top={top}
            height={height}
            leftPct={leftPct}
            widthPct={widthPct}
            zIndex={zIndex}
            hourRowHeight={hourRowHeight}
            fontScale={fontScale}
            reduceMotion={reduceMotion}
            dimmed={dimmedUid === event._event.uid}
            onPress={onPressEvent}
          />
        );
      })}

      {isToday && <NowIndicator date={date} />}
    </View>
  );
}

export const DayColumn = memo(DayColumnImpl);

interface NowIndicatorProps {
  date: Date;
  /** Optional clock override, used by tests. */
  now?: Date;
}

function NowIndicatorVisual({ date, now }: { date: Date; now: Date }) {
  if (!dayjs(now).isSame(date, 'day')) return null;
  return (
    <View
      testID="now-indicator"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.nowIndicator, { top: `${nowTopPct(now)}%` }]}
    />
  );
}

function NowIndicatorLive({ date }: { date: Date }) {
  const now = useNow();
  return <NowIndicatorVisual date={date} now={now} />;
}

/**
 * The only part of the grid that follows the wall clock. It is memoized and
 * self-contained so the minute tick re-renders this one 2px line, not the
 * whole day column, page, or time grid.
 */
export const NowIndicator = memo(function NowIndicator({ date, now }: NowIndicatorProps) {
  return now
    ? <NowIndicatorVisual date={date} now={now} />
    : <NowIndicatorLive date={date} />;
});

const styles = StyleSheet.create({
  column: { flex: 1, overflow: 'hidden' },
  nowIndicator: {
    position: 'absolute',
    zIndex: 10000,
    height: 2,
    width: '100%',
    backgroundColor: 'red',
  },
});
