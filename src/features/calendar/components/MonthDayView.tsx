import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import dayjs from 'dayjs';
import { useTheme } from 'expo-router';
import { dayKey } from '../utils/grid';
import InfinitePager, { type InfinitePagerImperativeApi } from 'react-native-infinite-pager';
import { useSettingsStore } from '@/stores/settingsStore';
import { contrastFor } from '../utils/eventInk';
import type { CalendarEvent } from '@/types';

const MAX_ANIMATED_JUMP_MONTHS = 2;
const DAYS_IN_WEEK = 7;
const DATE_ROW_HEIGHT = 22;
const LANE_HEIGHT = 15;
const FALLBACK_PAGE_HEIGHT = 420;

interface Props {
  date: Date;
  events: CalendarEvent[];
  weekStartsOn: 0 | 1;
  jump: { nonce: number; target: Date };
  onSelectDate: (d: Date) => void;
  onMonthChange: (d: Date) => void;
  onPressEvent: (e: CalendarEvent) => void;
  onPressCell: (d: Date) => void;
}

/**
 * Builds a fixed six-week month grid. Adjacent-month days are included so the
 * cells always line up and the last row can show the start of the next month,
 * matching the reference month layout.
 */
export function buildMonthGrid(
  year: number,
  month: number,
  weekStartsOn: 0 | 1,
): dayjs.Dayjs[][] {
  const firstOfMonth = dayjs(new Date(year, month, 1));
  const offset = (firstOfMonth.day() - weekStartsOn + 7) % 7;
  const firstCell = firstOfMonth.subtract(offset, 'day');

  return Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: DAYS_IN_WEEK }, (_, col) =>
      firstCell.add(row * DAYS_IN_WEEK + col, 'day'),
    ),
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function lastDayOf(e: CalendarEvent): Date {
  const end = startOfDay(e.dtend);
  if (e.allDay) return end;
  const exactMidnight =
    e.dtend.getHours() === 0 &&
    e.dtend.getMinutes() === 0 &&
    e.dtend.getSeconds() === 0 &&
    e.dtend.getMilliseconds() === 0;
  if (exactMidnight) {
    return new Date(end.getTime() - 1);
  }
  return end;
}

const EVENT_DAY_KEYS_CACHE = new Map<string, string[]>();
const EVENT_DAY_KEYS_CACHE_LIMIT = 200;

function cacheKeyFor(e: CalendarEvent): string {
  return `${e.uid}:${e.calendarId}:${e.dtstart.getTime()}:${e.dtend.getTime()}:${e.allDay}`;
}

export function eventDayKeys(e: CalendarEvent): string[] {
  const key = cacheKeyFor(e);
  const cached = EVENT_DAY_KEYS_CACHE.get(key);
  if (cached) return cached;

  const start = startOfDay(e.dtstart);
  const end = lastDayOf(e);
  const keys: string[] = [];
  let cur = start;
  const limit = 366;
  while (cur.getTime() <= end.getTime() && keys.length <= limit) {
    keys.push(dayKey(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }

  const result = keys.length ? keys : [dayKey(start)];

  if (EVENT_DAY_KEYS_CACHE.size >= EVENT_DAY_KEYS_CACHE_LIMIT) {
    const first = EVENT_DAY_KEYS_CACHE.keys().next().value;
    if (first !== undefined) EVENT_DAY_KEYS_CACHE.delete(first);
  }
  EVENT_DAY_KEYS_CACHE.set(key, result);

  return result;
}

export function eventCoversDay(e: CalendarEvent, key: string): boolean {
  const startKey = dayKey(startOfDay(e.dtstart));
  const end = lastDayOf(e);
  const endKey = dayKey(end);
  return key >= startKey && key <= (endKey < startKey ? startKey : endKey);
}

function monthDiff(from: Date, to: Date): number {
  return (dayjs(to).year() - dayjs(from).year()) * 12 + (dayjs(to).month() - dayjs(from).month());
}

interface WeekEvent {
  event: CalendarEvent;
  startCol: number;
  endCol: number;
  lane: number;
  continuesLeft: boolean;
  continuesRight: boolean;
}

function layoutWeek(week: dayjs.Dayjs[], events: CalendarEvent[]): WeekEvent[] {
  const weekStart = week[0].startOf('day');
  const weekEnd = week[DAYS_IN_WEEK - 1].endOf('day');
  const ranges: Omit<WeekEvent, 'lane'>[] = [];

  for (const event of events) {
    let startCol = -1;
    let endCol = -1;
    for (let col = 0; col < DAYS_IN_WEEK; col++) {
      if (eventCoversDay(event, dayKey(week[col].toDate()))) {
        if (startCol < 0) startCol = col;
        endCol = col;
      }
    }
    if (startCol < 0) continue;

    ranges.push({
      event,
      startCol,
      endCol,
      continuesLeft: dayjs(event.dtstart).startOf('day').isBefore(weekStart),
      continuesRight: dayjs(lastDayOf(event)).endOf('day').isAfter(weekEnd),
    });
  }

  ranges.sort((a, b) => {
    const aSpan = a.endCol - a.startCol;
    const bSpan = b.endCol - b.startCol;
    if (aSpan !== bSpan) return bSpan - aSpan;
    const byStart = a.event.dtstart.getTime() - b.event.dtstart.getTime();
    if (byStart !== 0) return byStart;
    const byEnd = a.event.dtend.getTime() - b.event.dtend.getTime();
    if (byEnd !== 0) return byEnd;
    return a.event.summary.localeCompare(b.event.summary);
  });

  const lanes: { startCol: number; endCol: number }[][] = [];
  return ranges.map((range) => {
    let lane = 0;
    while (
      lanes[lane]?.some(
        (occupied) =>
          range.startCol <= occupied.endCol && range.endCol >= occupied.startCol,
      )
    ) {
      lane += 1;
    }
    if (!lanes[lane]) lanes[lane] = [];
    lanes[lane].push({ startCol: range.startCol, endCol: range.endCol });
    return { ...range, lane };
  });
}

interface MonthGridProps {
  month: number;
  weeks: dayjs.Dayjs[][];
  selected: dayjs.Dayjs;
  today: dayjs.Dayjs;
  events: CalendarEvent[];
  colors: ReturnType<typeof useTheme>['colors'];
  onDayPress: (d: dayjs.Dayjs) => void;
  onPressCell: (d: Date) => void;
  onPressEvent: (e: CalendarEvent) => void;
}

const COLUMN_WIDTH_PCT = 100 / DAYS_IN_WEEK;

function asPct(value: number): `${number}%` {
  return `${value}%`;
}

const MonthGrid = memo(function MonthGrid({
  month, weeks, selected, today, events, colors, onDayPress, onPressCell, onPressEvent,
}: MonthGridProps) {
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const pageHeight = measuredHeight || FALLBACK_PAGE_HEIGHT;
  const weekHeight = pageHeight / weeks.length;
  const maxLanes = Math.max(
    1,
    Math.floor((weekHeight - DATE_ROW_HEIGHT - 2) / LANE_HEIGHT),
  );
  const weekLayouts = useMemo(
    () => weeks.map((week) => layoutWeek(week, events)),
    [weeks, events],
  );

  return (
    <View
      testID="month-page"
      style={styles.monthPage}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.height;
        if (next > 0 && next !== measuredHeight) setMeasuredHeight(next);
      }}
    >
      {weeks.map((week, weekIndex) => {
        const positioned = weekLayouts[weekIndex];
        const visible = positioned.filter((item) => item.lane < maxLanes);
        const hidden = positioned.length - visible.length;

        return (
          <View key={weekIndex} testID={`month-week-${weekIndex}`} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              const isOutside = day.month() !== month;
              const isToday = day.isSame(today, 'day');
              const isSelected = day.isSame(selected, 'day');

              return (
                <TouchableOpacity
                  key={dayIndex}
                  testID={`month-day-${day.format('YYYY-MM-DD')}`}
                  style={[
                    styles.dayCell,
                    { borderColor: colors.borderSubtle },
                    dayIndex === DAYS_IN_WEEK - 1 && styles.lastCol,
                    weekIndex === weeks.length - 1 && styles.lastRow,
                  ]}
                  disabled={isOutside}
                  onPress={() => onDayPress(day)}
                  onLongPress={() => onPressCell(day.toDate())}
                >
                  <View
                    style={[
                      styles.dateCircle,
                      isSelected && { backgroundColor: colors.primary },
                      !isSelected && isToday && {
                        borderWidth: 1.2,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      allowFontScaling={false}
                      style={[
                        styles.dateNumber,
                        {
                          color: isSelected
                            ? colors.primaryText
                            : isToday
                              ? colors.primary
                              : isOutside
                                ? colors.textTertiary
                                : colors.text,
                        },
                        (isSelected || isToday) && styles.dateNumberStrong,
                      ]}
                    >
                      {day.date()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {visible.map((item) => {
              const ink = contrastFor(item.event.color);
              const left =
                item.startCol * COLUMN_WIDTH_PCT + (item.continuesLeft ? 0 : 2);
              const rawWidth =
                (item.endCol - item.startCol + 1) * COLUMN_WIDTH_PCT -
                (item.continuesLeft ? 0 : 2) -
                (item.continuesRight ? 0 : 2);
              const width = Math.max(4, rawWidth);

              return (
                <TouchableOpacity
                  key={`${item.event.uid}-${item.event.dtstart.getTime()}-${weekIndex}-${item.lane}`}
                  testID={`month-event-${item.event.uid}-${weekIndex}`}
                  style={[
                    styles.eventBar,
                    {
                      left: asPct(left),
                      width: asPct(width),
                      top: DATE_ROW_HEIGHT + item.lane * LANE_HEIGHT,
                      height: LANE_HEIGHT - 1,
                      backgroundColor: item.event.color,
                      borderTopLeftRadius: item.continuesLeft ? 0 : 4,
                      borderBottomLeftRadius: item.continuesLeft ? 0 : 4,
                      borderTopRightRadius: item.continuesRight ? 0 : 4,
                      borderBottomRightRadius: item.continuesRight ? 0 : 4,
                    },
                  ]}
                  onPress={() => onPressEvent(item.event)}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="clip"
                    allowFontScaling={false}
                    style={[styles.eventTitle, { color: ink.text }]}
                  >
                    {item.event.summary}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {hidden > 0 && (
              <Text style={[styles.more, { color: colors.textTertiary, backgroundColor: colors.background }]}>+{hidden}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
});

function MonthDayViewImpl({
  date, events, weekStartsOn, jump, onSelectDate, onMonthChange, onPressEvent, onPressCell,
}: Props) {
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);

  const selected = useMemo(() => dayjs(date), [date]);
  const today = useMemo(() => dayjs(), []);

  const handleDayPress = useCallback((d: dayjs.Dayjs) => {
    onSelectDate(d.toDate());
  }, [onSelectDate]);

  const dayHeaders = useMemo(() => {
    const headers: string[] = [];
    for (let i = 0; i < DAYS_IN_WEEK; i++) {
      const dow = (weekStartsOn + i) % 7;
      headers.push(dayjs().day(dow).locale(language).format('dd').charAt(0).toUpperCase());
    }
    return headers;
  }, [weekStartsOn, language]);

  const [localAnchor, setLocalAnchor] = useState(date);
  const [pagerKey, setPagerKey] = useState(0);
  const pagerRef = useRef<InfinitePagerImperativeApi>(null);
  const localAnchorRef = useRef(localAnchor); localAnchorRef.current = localAnchor;
  const settledIndexRef = useRef(0);
  const jumpTargetRef = useRef<number | null>(null);

  const firstAnchorReset = useRef(true);
  useLayoutEffect(() => {
    if (firstAnchorReset.current) { firstAnchorReset.current = false; return; }
    settledIndexRef.current = 0;
    setPagerKey((k) => k + 1);
  }, [localAnchor]);

  const firstJump = useRef(true);
  useEffect(() => {
    if (firstJump.current) { firstJump.current = false; return; }
    const target = monthDiff(localAnchorRef.current, jump.target);
    const from = settledIndexRef.current;
    if (target === from) return;
    if (Math.abs(target - from) <= MAX_ANIMATED_JUMP_MONTHS) {
      jumpTargetRef.current = target;
      settledIndexRef.current = target;
      pagerRef.current?.setPage(target, { animated: true });
      return;
    }
    setLocalAnchor(jump.target);
  }, [jump]);

  const handlePageChange = useCallback((index: number) => {
    const prev = settledIndexRef.current;
    settledIndexRef.current = index;
    if (jumpTargetRef.current !== null) {
      if (index === jumpTargetRef.current) jumpTargetRef.current = null;
      return;
    }
    if (index === prev) return;
    onMonthChange(dayjs(localAnchorRef.current).add(index, 'month').startOf('month').toDate());
  }, [onMonthChange]);

  const renderPage = useCallback(({ index }: { index: number }) => {
    const month = dayjs(localAnchor).add(index, 'month');
    const weeks = buildMonthGrid(month.year(), month.month(), weekStartsOn);
    return (
      <MonthGrid
        month={month.month()}
        weeks={weeks}
        selected={selected}
        today={today}
        events={events}
        colors={theme.colors}
        onDayPress={handleDayPress}
        onPressCell={onPressCell}
        onPressEvent={onPressEvent}
      />
    );
  }, [
    localAnchor, weekStartsOn, selected, today, events, theme.colors,
    handleDayPress, onPressCell, onPressEvent,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.dowRow, { borderBottomColor: theme.colors.borderSubtle }]}>
        {dayHeaders.map((label, index) => (
          <Text
            key={index}
            style={[styles.dowLabel, { color: theme.colors.textTertiary }]}
            allowFontScaling={false}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.pagerWrap}>
        <InfinitePager
          key={pagerKey}
          ref={pagerRef}
          style={styles.fill}
          pageWrapperStyle={styles.fill}
          renderPage={renderPage}
          onPageChange={handlePageChange}
          pageBuffer={1}
        />
      </View>
    </View>
  );
}

export const MonthDayView = memo(MonthDayViewImpl);

const styles = StyleSheet.create({
  container: { flex: 1 },
  fill: { flex: 1 },
  dowRow: {
    flexDirection: 'row',
    height: 22,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dowLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pagerWrap: { flex: 1 },
  monthPage: { flex: 1 },
  weekRow: { flex: 1, flexDirection: 'row', position: 'relative' },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 1,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastCol: { borderRightWidth: 0 },
  lastRow: { borderBottomWidth: 0 },
  dateCircle: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumber: { fontSize: 12, textAlign: 'center' },
  dateNumberStrong: { fontWeight: '700' },
  eventBar: {
    position: 'absolute',
    justifyContent: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  eventTitle: { fontSize: 10, lineHeight: 12, fontWeight: '500' },
  more: {
    position: 'absolute',
    right: 4,
    bottom: 1,
    fontSize: 9,
    fontWeight: '600',
    paddingHorizontal: 2,
  },
});
