import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'expo-router';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { CalendarDays, ChevronRight, Search } from 'lucide-react-native';

import { Sheet, Spinner, Typography } from '@/ui/components';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTimeFormat } from '@/hooks/useTimeFormat';
import { getNativePickerLocale } from '@/utils/i18n';
import type { CalendarEvent } from '@/types';

import { useEventSearch } from '@/features/calendar/hooks/useEventSearch';

dayjs.extend(localizedFormat);

export interface CalendarSearchSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Receives the picked calendar day at local midnight. The sheet closes itself. */
  onSelectDate: (date: Date) => void;
  /** Receives the selected occurrence. The sheet closes itself. */
  onPressEvent: (event: CalendarEvent) => void;
}

interface ResultRowProps {
  event: CalendarEvent;
  onPress: (event: CalendarEvent) => void;
}

const ResultRow = memo(function ResultRow({ event, onPress }: ResultRowProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const { formatTime } = useTimeFormat();

  const title = (event.summary ?? '').trim() || t('calendar.noTitle');
  const when = useMemo(
    () => formatEventWhen(event, language, formatTime, t('calendar.allDay')),
    [event, formatTime, language, t],
  );

  return (
    <Pressable
      testID={`calendar-search-result-${event.uid}`}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${when}${event.location ? `, ${event.location}` : ''}`}
      onPress={() => onPress(event)}
      style={({ pressed }) => [
        styles.resultRow,
        { backgroundColor: pressed ? colors.surfaceRaised : colors.surface },
      ]}
    >
      <View style={[styles.colorDot, { backgroundColor: event.color || colors.primary }]} />
      <View style={styles.resultText}>
        <Typography variant="body1" numberOfLines={1}>
          {title}
        </Typography>
        <Typography variant="caption" color="secondary" numberOfLines={1}>
          {when}
        </Typography>
        {event.location ? (
          <Typography variant="caption" color={colors.textTertiary} numberOfLines={1}>
            {event.location}
          </Typography>
        ) : null}
      </View>
    </Pressable>
  );
});

export function CalendarSearchSheet({
  visible,
  onClose,
  onSelectDate,
  onPressEvent,
}: CalendarSearchSheetProps) {
  const { colors, radius } = useTheme();
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const { height } = useWindowDimensions();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [pickerDate, setPickerDate] = useState(() => new Date());
  const [androidPickerVisible, setAndroidPickerVisible] = useState(false);
  const [iosPickerVisible, setIosPickerVisible] = useState(false);

  const { results, loading, error } = useEventSearch(query, { enabled: visible });
  const trimmedQuery = query.trim();

  const bodyMaxHeight = Math.max(220, Math.min(420, height * 0.44));
  const listMaxHeight = Math.max(150, Math.min(310, height * 0.3));

  const close = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setAndroidPickerVisible(false);
      setIosPickerVisible(false);
      return;
    }
    setPickerDate(new Date());
    const input = inputRef.current;
    if (input && typeof input.focus === 'function') input.focus();
  }, [visible]);

  const selectDate = useCallback((date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    onSelectDate(day);
    close();
  }, [close, onSelectDate]);

  const handleIosDateChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    if (!date) return;
    setPickerDate(date);
    setIosPickerVisible(false);
    selectDate(date);
  }, [selectDate]);

  const handleAndroidDateChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      setAndroidPickerVisible(false);
      if (event.type !== 'set' || !date) return;
      setPickerDate(date);
      selectDate(date);
    },
    [selectDate],
  );

  const openAndroidPicker = useCallback(() => {
    Keyboard.dismiss();
    setAndroidPickerVisible(true);
  }, []);

  const handlePressResult = useCallback(
    (event: CalendarEvent) => {
      close();
      onPressEvent(event);
    },
    [close, onPressEvent],
  );

  const renderResult = useCallback(
    ({ item }: { item: CalendarEvent }) => (
      <ResultRow event={item} onPress={handlePressResult} />
    ),
    [handlePressResult],
  );

  const keyExtractor = useCallback(
    (item: CalendarEvent) => `${item.calendarId}:${item.uid}:${item.dtstart.getTime()}`,
    [],
  );

  const dateLabel = useMemo(
    () => dayjs(pickerDate).locale(language).format('ll'),
    [language, pickerDate],
  );

  const jumpLabel = t('calendar.search.jumpToDate', { defaultValue: 'Jump to date' });
  const placeholder = t('calendar.search.placeholder', { defaultValue: 'Search events' });

  const jumpText = (
    <View style={styles.jumpText}>
      <Typography variant="body2">{jumpLabel}</Typography>
      {Platform.OS !== 'ios' ? (
        <Typography variant="caption" color="secondary">
          {dateLabel}
        </Typography>
      ) : null}
    </View>
  );

  const jumpRowStyle = [
    styles.jumpRow,
    { backgroundColor: colors.surface, borderRadius: radius.md },
  ];

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={t('calendar.search.title', { defaultValue: 'Search' })}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <View style={[styles.body, { maxHeight: bodyMaxHeight }]}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderStrong,
                borderRadius: radius.md,
              },
            ]}
          >
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              ref={inputRef}
              testID="calendar-search-input"
              value={query}
              onChangeText={setQuery}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
              onSubmitEditing={() => Keyboard.dismiss()}
              style={[styles.input, { color: colors.text }]}
              accessibilityLabel={placeholder}
            />
            {loading ? <Spinner size="small" /> : null}
          </View>

          {Platform.OS === 'ios' ? (
            <>
              <View style={jumpRowStyle}>
                <Pressable
                  testID="calendar-search-jump"
                  accessibilityRole="button"
                  accessibilityLabel={`${jumpLabel}, ${dateLabel}`}
                  onPress={() => {
                    Keyboard.dismiss();
                    setIosPickerVisible(true);
                  }}
                  style={styles.iosJumpLabel}
                >
                  <CalendarDays size={18} color={colors.primary} />
                  {jumpText}
                </Pressable>
                {!iosPickerVisible ? (
                  <DateTimePicker
                    testID="calendar-search-date-picker"
                    value={pickerDate}
                    mode="date"
                    display="compact"
                    accentColor={colors.primary}
                    locale={getNativePickerLocale(language)}
                    onChange={handleIosDateChange}
                  />
                ) : null}
              </View>
              {iosPickerVisible ? (
                <DateTimePicker
                  testID="calendar-search-inline-date-picker"
                  value={pickerDate}
                  mode="date"
                  display="spinner"
                  accentColor={colors.primary}
                  locale={getNativePickerLocale(language)}
                  onChange={handleIosDateChange}
                />
              ) : null}
            </>
          ) : (
            <Pressable
              testID="calendar-search-jump"
              accessibilityRole="button"
              accessibilityLabel={`${jumpLabel}, ${dateLabel}`}
              onPress={openAndroidPicker}
              style={({ pressed }) => [
                styles.jumpRow,
                { backgroundColor: colors.surface, borderRadius: radius.md },
                pressed ? { opacity: 0.7 } : null,
              ]}
            >
              <CalendarDays size={18} color={colors.primary} />
              {jumpText}
              <ChevronRight size={18} color={colors.textTertiary} />
            </Pressable>
          )}

          {Platform.OS === 'android' && androidPickerVisible ? (
            <DateTimePicker
              testID="calendar-search-date-picker"
              value={pickerDate}
              mode="date"
              display="default"
              onChange={handleAndroidDateChange}
            />
          ) : null}

          {!trimmedQuery ? (
            <Typography variant="caption" color="secondary" style={styles.stateText}>
              {t('calendar.search.hint', {
                defaultValue: "Search this account's events by title or location.",
              })}
            </Typography>
          ) : loading && results.length === 0 ? (
            <View style={[styles.stateRow, { maxHeight: listMaxHeight }]}>
              <Spinner size="small" />
              <Typography variant="caption" color="secondary">
                {t('calendar.search.searching', { defaultValue: 'Searching…' })}
              </Typography>
            </View>
          ) : error ? (
            <Typography
              testID="calendar-search-error"
              variant="caption"
              color="danger"
              style={styles.stateText}
            >
              {t('calendar.search.error', { defaultValue: "Couldn't search events." })}
            </Typography>
          ) : results.length === 0 ? (
            <Typography
              testID="calendar-search-empty"
              variant="caption"
              color="secondary"
              style={styles.stateText}
            >
              {t('calendar.search.noResults', { defaultValue: 'No matching events' })}
            </Typography>
          ) : (
            <FlatList
              testID="calendar-search-results"
              data={results}
              keyExtractor={keyExtractor}
              renderItem={renderResult}
              style={[styles.results, { maxHeight: listMaxHeight }]}
              contentContainerStyle={styles.resultsContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Sheet>
  );
}

function formatEventWhen(
  event: CalendarEvent,
  language: string,
  formatTime: (value: Date) => string,
  allDayLabel: string,
): string {
  const start = dayjs(event.dtstart).locale(language);
  const end = dayjs(event.dtend).locale(language);

  if (event.allDay) {
    const last = end;
    return start.isSame(last, 'day')
      ? `${start.format('ddd, ll')} · ${allDayLabel}`
      : `${start.format('ll')} – ${last.format('ll')} · ${allDayLabel}`;
  }

  if (start.isSame(end, 'day')) {
    return `${start.format('ddd, ll')} · ${formatTime(event.dtstart)} – ${formatTime(event.dtend)}`;
  }

  return `${start.format('ddd, ll')} ${formatTime(event.dtstart)} – ${
    end.format('ddd, ll')
  } ${formatTime(event.dtend)}`;
}

const styles = StyleSheet.create({
  keyboardWrap: { width: '100%' },
  body: {
    width: '100%',
    flexShrink: 1,
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  jumpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  jumpText: { flex: 1, gap: 2 },
  iosJumpLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  results: {
    flexGrow: 0,
    flexShrink: 1,
  },
  resultsContent: { gap: 8, paddingBottom: 2 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 54,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  resultText: { flex: 1, gap: 1 },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  stateText: {
    textAlign: 'center',
    paddingVertical: 14,
  },
});

export default CalendarSearchSheet;
