import { memo, useRef, useCallback, useEffect, useMemo, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, type ViewToken,
  type NativeScrollEvent, type NativeSyntheticEvent,
} from 'react-native';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'expo-router';
import type { Theme } from '@/theme';
import type { CalendarEvent } from '@/types';
import { useTimeFormat } from '@/hooks/useTimeFormat';
import {
  AGENDA_FUTURE_DAYS, AGENDA_PAST_DAYS, agendaRowKey, buildAgendaSections,
} from '../utils/agendaSections';
import { useCalendarDensity, type CalendarDensity } from '../hooks/useCalendarDensity';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { useToday } from '../hooks/useToday';

dayjs.extend(localizedFormat);

interface Props {
  events: CalendarEvent[];
  date: Date;
  onPressEvent: (event: CalendarEvent) => void;
  onPressCell: (date: Date) => void;
  onVisibleDateChange?: (date: Date) => void;
}

const TODAY_JUMP_GUARD_MS = 500;

interface DayHeaderProps {
  sectionDate: Date;
  hasEvents: boolean;
  isToday: boolean;
  theme: Theme;
  density: CalendarDensity;
  reduceMotion: boolean;
  onPress: (d: Date) => void;
}

const DayHeader = memo(({
  sectionDate, hasEvents, isToday, theme, density, reduceMotion, onPress,
}: DayHeaderProps) => {
  const { t } = useTranslation();
  const d = dayjs(sectionDate);
  const dayLabel = d.format('dddd, D MMMM');
  const accessibilityLabel = [
    dayLabel,
    isToday ? t('calendar.today') : null,
    !hasEvents ? t('calendar.noEvents') : null,
  ].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t('event.newEvent')}
      onPress={() => onPress(sectionDate)}
      style={[
        styles.dayHeader,
        {
          height: density.agendaHeaderHeight,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.borderSubtle,
        },
      ]}
      activeOpacity={reduceMotion ? 1 : 0.7}
    >
      <View
        style={[
          styles.dayBadge,
          {
            width: density.agendaDayBadgeSize,
            height: density.agendaDayBadgeSize,
            borderRadius: density.agendaDayBadgeSize / 2,
          },
          isToday && { backgroundColor: theme.colors.primary },
        ]}
      >
        <Text
          allowFontScaling={false}
          style={[
            styles.dayNum,
            { fontSize: density.agendaDayNumberSize, color: isToday ? theme.colors.primaryText : theme.colors.text },
          ]}
        >
          {d.format('D')}
        </Text>
      </View>
      <View>
        <Text
          allowFontScaling={false}
          style={[
            styles.dayName,
            { fontSize: density.agendaDayNameSize, color: isToday ? theme.colors.primary : theme.colors.textSecondary },
          ]}
        >
          {d.format('ddd').toUpperCase()}
        </Text>
        {isToday && (
          <Text
            allowFontScaling={false}
            style={[
              styles.todayLabel,
              { fontSize: density.agendaTodayLabelSize, color: theme.colors.primary },
            ]}
          >
            {t('calendar.today')}
          </Text>
        )}
      </View>
      {!hasEvents && (
        <Text
          allowFontScaling={false}
          style={[
            styles.noEvents,
            { fontSize: density.agendaNoEventsSize, color: theme.colors.textTertiary },
          ]}
        >
          {t('calendar.noEvents')}
        </Text>
      )}
    </TouchableOpacity>
  );
});

interface EventRowProps {
  event: CalendarEvent;
  theme: Theme;
  height: number;
  density: CalendarDensity;
  reduceMotion: boolean;
  onPress: (e: CalendarEvent) => void;
}

const EventRow = memo(({ event, theme, height, density, reduceMotion, onPress }: EventRowProps) => {
  const { t } = useTranslation();
  const { formatTime } = useTimeFormat();
  const duration = event.allDay
    ? null
    : (() => {
        const mins = dayjs(event.dtend).diff(dayjs(event.dtstart), 'minute');
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m ? `${h}h ${m}m` : `${h}h`;
      })();

  const allDayLabel = t('calendar.allDay');
  const title = event.summary || t('calendar.noTitle');
  const timeLabel = event.allDay
    ? allDayLabel
    : `${formatTime(event.dtstart)} – ${formatTime(event.dtend)}`;
  const accessibilityLabel = [
    title,
    timeLabel,
    duration,
    event.location || null,
  ].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.eventRow, { height: height - 6, backgroundColor: theme.colors.surface }]}
      onPress={() => onPress(event)}
      activeOpacity={reduceMotion ? 1 : 0.75}
    >
      <View style={[styles.colorBar, { backgroundColor: event.color }]} />
      <View style={styles.eventContent}>
        <Text
          allowFontScaling={false}
          style={[
            styles.eventTitle,
            { fontSize: density.agendaEventTitleSize, color: theme.colors.text },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={styles.eventMeta}>
          <Text
            allowFontScaling={false}
            style={[
              styles.eventTime,
              { fontSize: density.agendaEventMetaSize, color: theme.colors.textSecondary },
            ]}
          >
            {event.allDay ? allDayLabel : formatTime(event.dtstart)}
            {!event.allDay && ` – ${formatTime(event.dtend)}`}
          </Text>
          {duration && (
            <Text
              allowFontScaling={false}
              style={[
                styles.eventDuration,
                { fontSize: density.agendaEventDetailSize, color: theme.colors.textTertiary },
              ]}
            >
              {duration}
            </Text>
          )}
          {event.location ? (
            <Text
              allowFontScaling={false}
              style={[
                styles.eventLocation,
                { fontSize: density.agendaEventDetailSize, color: theme.colors.textTertiary },
              ]}
              numberOfLines={1}
            >
              · {event.location}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export interface AgendaViewHandle {
  scrollToToday: () => void;
}

type Row =
  | { type: 'header'; key: string; date: Date; hasEvents: boolean }
  | { type: 'item'; key: string; date: Date; event: CalendarEvent };

const AgendaViewImpl = forwardRef<AgendaViewHandle, Props>(function AgendaView(
  { events, date, onPressEvent, onPressCell, onVisibleDateChange }, ref
) {
  const theme = useTheme();
  const density = useCalendarDensity();
  const reduceMotion = useReduceMotion();
  const today = useToday();
  const listRef = useRef<FlatList<Row>>(null);
  const todayKey = dayjs(today).format('YYYY-MM-DD');

  const { rows, stickyIndices, offsets, todayIndex } = useMemo(() => {
    const todayDayjs = dayjs(today);
    const sections = buildAgendaSections(
      events,
      todayDayjs.subtract(AGENDA_PAST_DAYS, 'day').toDate(),
      todayDayjs.add(AGENDA_FUTURE_DAYS, 'day').toDate(),
    );
    const out: Row[] = [];
    const sticky: number[] = [];
    const offs: number[] = [];
    let y = 0;
    let todayIdx = 0;
    for (const s of sections) {
      if (s.key === todayKey) todayIdx = out.length;
      sticky.push(out.length);
      offs.push(y);
      y += density.agendaHeaderHeight;
      out.push({ type: 'header', key: s.key, date: s.date, hasEvents: s.data.length > 0 });
      for (const e of s.data) {
        offs.push(y);
        y += density.agendaEventHeight;
        out.push({ type: 'item', key: s.key, date: s.date, event: e });
      }
    }
    return { rows: out, stickyIndices: sticky, offsets: offs, todayIndex: todayIdx };
  }, [events, today, todayKey, density]);

  const getItemLayout = useCallback((data: ArrayLike<Row> | null | undefined, index: number) => ({
    length: data?.[index]?.type === 'header' ? density.agendaHeaderHeight : density.agendaEventHeight,
    offset: offsets[index] ?? 0,
    index,
  }), [offsets, density]);

  const dateKey = dayjs(date).format('YYYY-MM-DD');
  const initialIndex = useMemo(() => {
    const index = rows.findIndex((row) => row.type === 'header' && row.key === dateKey);
    return index >= 0 ? index : todayIndex;
  }, [rows, dateKey, todayIndex]);
  const initialHeaderKey = rows[initialIndex]?.type === 'header' && rows[initialIndex].key === dateKey
    ? dateKey
    : todayKey;

  const scrollYRef = useRef(offsets[initialIndex] ?? offsets[todayIndex] ?? 0);
  const anchorRef = useRef({ key: initialHeaderKey, delta: 0 });
  const layoutRef = useRef({ rows, offsets });
  const userScrollingRef = useRef(false);
  const onUserScrollStart = useCallback(() => { userScrollingRef.current = true; }, []);
  const onUserScrollEnd = useCallback(() => { userScrollingRef.current = false; }, []);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollYRef.current = y;
    if (!userScrollingRef.current) return;
    const { rows: r, offsets: o } = layoutRef.current;
    let i = upperBound(o, y) - 1;
    while (i > 0 && r[i].type !== 'header') i--;
    if (r[i]) anchorRef.current = { key: r[i].key, delta: y - o[i] };
  }, []);

  useLayoutEffect(() => {
    layoutRef.current = { rows, offsets };
    const anchor = anchorRef.current;
    const idx = rows.findIndex((r) => r.type === 'header' && r.key === anchor.key);
    if (idx < 0) return;
    const y = offsets[idx] + anchor.delta;
    if (Math.abs(y - scrollYRef.current) < 1) return;
    scrollYRef.current = y;
    listRef.current?.scrollToOffset({ offset: y, animated: false });
  }, [rows, offsets]);

  const lastDateJumpRef = useRef<string | null>(null);
  useEffect(() => {
    const key = dayjs(date).format('YYYY-MM-DD');
    const index = rows.findIndex((row) => row.type === 'header' && row.key === key);
    if (index < 0 || lastDateJumpRef.current === key) return;
    lastDateJumpRef.current = key;
    const y = offsets[index];
    userScrollingRef.current = false;
    anchorRef.current = { key, delta: 0 };
    scrollYRef.current = y;
    listRef.current?.scrollToOffset({ offset: y, animated: !reduceMotion });
  }, [date, rows, offsets, reduceMotion]);

  const initialIndexRef = useRef(initialIndex);
  const todayRef = useRef({ key: todayKey, y: offsets[todayIndex] ?? 0 });
  todayRef.current = { key: todayKey, y: offsets[todayIndex] ?? 0 };
  const lastJumpAtRef = useRef(0);
  useImperativeHandle(ref, () => ({
    scrollToToday: () => {
      const now = Date.now();
      if (now - lastJumpAtRef.current < TODAY_JUMP_GUARD_MS) return;
      lastJumpAtRef.current = now;
      const { key, y } = todayRef.current;
      userScrollingRef.current = false;
      anchorRef.current = { key, delta: 0 };
      scrollYRef.current = y;
      listRef.current?.scrollToOffset({ offset: y, animated: false });
    },
  }), []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });
  const onVisibleRef = useRef(onVisibleDateChange);
  onVisibleRef.current = onVisibleDateChange;
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const row = viewableItems[0]?.item as Row | undefined;
    if (row) onVisibleRef.current?.(row.date);
  }, []);

  const renderRow = useCallback(({ item }: { item: Row }) => (
    item.type === 'header'
      ? (
        <DayHeader
          sectionDate={item.date}
          hasEvents={item.hasEvents}
          isToday={item.key === todayKey}
          theme={theme}
          density={density}
          reduceMotion={reduceMotion}
          onPress={onPressCell}
        />
      )
      : (
        <EventRow
          event={item.event}
          theme={theme}
          height={density.agendaEventHeight}
          density={density}
          reduceMotion={reduceMotion}
          onPress={onPressEvent}
        />
      )
  ), [theme, density, reduceMotion, todayKey, onPressCell, onPressEvent]);

  const keyExtractor = useCallback((item: Row) => (
    item.type === 'header' ? `h-${item.key}` : agendaRowKey(item.key, item.event)
  ), []);

  return (
    <FlatList<Row>
      ref={listRef}
      data={rows}
      keyExtractor={keyExtractor}
      renderItem={renderRow}
      getItemLayout={getItemLayout}
      initialScrollIndex={initialIndexRef.current}
      stickyHeaderIndices={stickyIndices}
      initialNumToRender={20}
      maxToRenderPerBatch={16}
      windowSize={9}
      removeClippedSubviews
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingBottom: 80 }}
      onScroll={onScroll}
      onScrollBeginDrag={onUserScrollStart}
      onScrollEndDrag={onUserScrollEnd}
      onMomentumScrollBegin={onUserScrollStart}
      onMomentumScrollEnd={onUserScrollEnd}
      scrollEventThrottle={32}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig.current}
    />
  );
});

function upperBound(sorted: number[], v: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export const AgendaView = memo(AgendaViewImpl);

const styles = StyleSheet.create({
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  dayBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { fontSize: 16, fontWeight: '700' },
  dayName: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  todayLabel: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  noEvents: { fontSize: 13, marginLeft: 4, fontStyle: 'italic' },
  eventRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  colorBar: { width: 4 },
  eventContent: { flex: 1, padding: 10, justifyContent: 'center' },
  eventTitle: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventTime: { fontSize: 12, fontWeight: '500' },
  eventDuration: { fontSize: 11 },
  eventLocation: { fontSize: 11, flex: 1 },
});
