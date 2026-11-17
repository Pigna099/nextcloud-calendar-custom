import { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from 'expo-router';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useSettingsStore } from '@/stores/settingsStore';
import type { CalendarEvent } from '@/types';
import { allDayEventsForDay, dayKey } from '../utils/grid';
import { allDaySectionHeight, MIN_TOUCH_TARGET, useCalendarDensity } from '../hooks/useCalendarDensity';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { useToday } from '../hooks/useToday';
import { eventChipColorsWithInk, mixColor } from '../utils/eventInk';

interface Props {
  dates: Date[];
  /** Optional override used by tests; the live grid reads the wall clock. */
  now?: Date;
  allDayEvents: CalendarEvent[];
  onPressEvent: (event: CalendarEvent) => void;
}

/** Keep the day-number band comfortably sized when the font scale is low. */
const MIN_GRID_DAY_HEADER_CONTENT = MIN_TOUCH_TARGET;

function TimeGridHeaderImpl({ dates, now, allDayEvents, onPressEvent }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const density = useCalendarDensity();
  const reduceMotion = useReduceMotion();
  const today = useToday();
  const current = now ?? today;

  const { sectionHeight, byDate } = useMemo(
    () => ({
      sectionHeight: allDaySectionHeight(dates, allDayEvents, density),
      byDate: dates.map((d) => allDayEventsForDay(d, allDayEvents)),
    }),
    [dates, allDayEvents, density]
  );

  return (
    <View style={{ flexDirection: 'row', flex: 1 }}>
      {dates.map((date, i) => {
        const isHighlight = dayjs(current).isSame(date, 'day');
        const dayLabel = dayjs(date).locale(language).format('dddd, D MMMM');
        const accessibilityLabel = isHighlight
          ? `${dayLabel}, ${t('calendar.today')}`
          : dayLabel;

        return (
          <View key={dayKey(date)} style={{ flex: 1, paddingTop: 8 }}>
            <View
              accessible
              accessibilityRole="header"
              accessibilityLabel={accessibilityLabel}
              style={{
                height: Math.max(MIN_GRID_DAY_HEADER_CONTENT, density.gridDayHeaderHeight - 10),
                justifyContent: 'space-between',
              }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  textAlign: 'center', fontSize: density.gridDayWeekdaySize, fontWeight: '600',
                  textTransform: 'capitalize',
                  color: isHighlight ? theme.colors.primary : theme.colors.textSecondary,
                }}
              >
                {dayjs(date).locale(language).format('ddd')}
              </Text>
              <View
                testID={isHighlight ? `day-highlight-${dayKey(date)}` : undefined}
                style={[
                  { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
                  isHighlight && {
                    width: density.gridDayBadgeSize,
                    height: density.gridDayBadgeSize,
                    borderRadius: density.gridDayBadgeSize / 2,
                    backgroundColor: mixColor(
                      theme.colors.primary, theme.colors.background, theme.dark ? 0.3 : 0.14,
                    ),
                    marginBottom: 0,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  allowFontScaling={false}
                  style={{
                    fontSize: density.gridDayNumberSize,
                    textAlign: 'center',
                    color: isHighlight ? theme.colors.primary : theme.colors.text,
                  }}
                >
                  {dayjs(date).format('D')}
                </Text>
              </View>
            </View>

            {byDate[i].length > 0 && (
              <View style={{ borderLeftWidth: 1, borderLeftColor: theme.colors.border, height: sectionHeight }}>
                {byDate[i].map((event, chipIndex) => {
                  const chip = eventChipColorsWithInk(
                    event.color, theme.colors.surfaceRaised, theme.dark,
                  );
                  return (
                    <TouchableOpacity
                      key={`${event.uid}-${event.dtstart.getTime()}-${chipIndex}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${event.summary || t('calendar.noTitle')}, ${t('calendar.allDay')}`}
                      activeOpacity={reduceMotion ? 1 : 0.2}
                      hitSlop={{
                        top: Math.floor(density.allDayChipGap / 2),
                        bottom: Math.floor(density.allDayChipGap / 2),
                        left: 0,
                        right: 0,
                      }}
                      style={{
                        backgroundColor: chip.background,
                        borderLeftColor: chip.rail,
                        borderLeftWidth: 3,
                        borderRadius: 2,
                        paddingHorizontal: 4,
                        height: density.allDayChipHeight,
                        justifyContent: 'center',
                        marginTop: density.allDayChipGap,
                        marginHorizontal: 2,
                      }}
                      onPress={() => onPressEvent(event)}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: density.allDayChipFontSize,
                          lineHeight: density.allDayChipLineHeight,
                          color: chip.text,
                        }}
                        numberOfLines={1}
                      >
                        {event.summary || t('calendar.noTitle')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export const TimeGridHeader = memo(TimeGridHeaderImpl);
