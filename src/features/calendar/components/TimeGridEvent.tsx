import { memo, useRef } from 'react';
import { TouchableOpacity, View, StyleSheet, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useTheme } from 'expo-router';
import { Typography } from '@/ui/components';
import type { GridEvent } from '../utils/toGridEvents';
import { eventChipColorsWithInk } from '../utils/eventInk';
import { useTimeFormat } from '@/hooks/useTimeFormat';
import { LONG_PRESS_MS } from '../constants';

interface Props {
  event: GridEvent;
  top: string;
  height: string;
  leftPct: number;
  widthPct: number;
  zIndex: number;
  hourRowHeight: number;
  fontScale?: number;
  reduceMotion?: boolean;
  dimmed?: boolean;
  onPress: (event: GridEvent) => void;
}

function TimeGridEventImpl({
  event, top, height, leftPct, widthPct, zIndex, hourRowHeight,
  fontScale = 1, reduceMotion = false, dimmed, onPress,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const zoomScale = Math.min(Math.max((hourRowHeight - 30) / 170, 0), 1);
  // Event cards are bounded by their duration, so let type grow only 25% even
  // when the rest of the app follows a larger accessibility font scale.
  const textScale = Math.min(fontScale, 1.25);
  const titleSize = Math.round((11 + zoomScale * 4) * textScale);
  const timeSize = Math.round((9 + zoomScale * 2) * textScale);
  const pad = Math.round((2 + zoomScale * 4) * textScale);
  const color = event.color;
  const chip = eventChipColorsWithInk(color, theme.colors.surfaceRaised, theme.dark);
  const { formatTime } = useTimeFormat();
  const durationMin = dayjs(event.end).diff(event.start, 'minute');

  const accessibilityLabel = [
    event.title || t('calendar.noTitle'),
    `${formatTime(event.start)}–${formatTime(event.end)}`,
    event._event.location || null,
  ].filter(Boolean).join(', ');

  // No hitSlop here: the space around a card belongs to the events stacked
  // above/below it or to the neighbouring day column, so expanding the touch
  // target would steal their taps.

  // A finger that rested here for the long-press window was grabbing the event,
  // not tapping it, so it must not navigate on lift. The drag gesture cannot be
  // relied on to have swallowed that touch: RNGH fails an activateAfterLongPress
  // pan as soon as the finger drifts past the touch slop before the timer fires,
  // and a failed pan never cancels this Touchable underneath it. Without the
  // guard, the common "press, wobble, drag" opens the detail screen instead.
  const pressedAt = useRef(0);

  const positionStyle: ViewStyle = {
    position: 'absolute',
    top: top as ViewStyle['top'],
    height: height as ViewStyle['height'],
    marginTop: 2,
    zIndex,
    left: `${leftPct}%` as ViewStyle['left'],
    width: `${widthPct}%` as ViewStyle['width'],
    opacity: dimmed ? 0.35 : 1,
  };

  return (
    <TouchableOpacity
      testID={`event-box-${event._event.uid}`}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={reduceMotion ? 1 : 0.2}
      onPressIn={() => { pressedAt.current = Date.now(); }}
      onPress={() => {
        if (Date.now() - pressedAt.current < LONG_PRESS_MS) onPress(event);
      }}
      style={positionStyle}
    >
      {/* The background/border box, inset from the touch target's right edge by
          marginRight so neighbouring events keep a visible 3px gap — width-based
          sizing (unlike the old right-anchored box) paints to the touch target's
          full width otherwise. */}
      <View
        testID={`event-card-${event._event.uid}`}
        style={[
          styles.card,
          {
            flex: 1,
            marginRight: 3,
            backgroundColor: chip.background,
            borderColor: chip.border,
            borderLeftColor: chip.rail,
            borderLeftWidth: 3,
            paddingLeft: leftPct > 0 ? 2 : 3,
            paddingRight: 3,
            paddingVertical: Math.max(pad - 1, 1),
          },
        ]}
      >
        {durationMin < 30 ? (
          <Typography allowFontScaling={false} variant="body2" weight="600" color={chip.text} style={{ fontSize: titleSize, lineHeight: Math.round(titleSize * 1.25) }} numberOfLines={1}>
            {event.title || t('calendar.noTitle')}
          </Typography>
        ) : (
          <>
            <Typography allowFontScaling={false} variant="body2" weight="600" color={chip.text} style={{ fontSize: titleSize, lineHeight: Math.round(titleSize * 1.25) }} numberOfLines={2}>
              {event.title || t('calendar.noTitle')}
            </Typography>
            <Typography allowFontScaling={false} color={chip.textSecondary} weight="400" style={{ fontSize: timeSize, lineHeight: Math.round(timeSize * 1.25) }} numberOfLines={1}>
              {formatTime(event.start)}–{formatTime(event.end)}
            </Typography>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

export const TimeGridEvent = memo(TimeGridEventImpl);

const styles = StyleSheet.create({
  card: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
