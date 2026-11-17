import { memo } from 'react';
import {
  FlatList, Modal, StyleSheet, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'expo-router';
import { X } from 'lucide-react-native';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { AnimatedPressable, Button, Icon, Typography } from '@/ui/components';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTimeFormat } from '@/hooks/useTimeFormat';
import { useReduceMotion } from '../hooks/useReduceMotion';
import type { CalendarEvent } from '@/types';

dayjs.extend(localizedFormat);

interface Props {
  visible: boolean;
  date: Date | null;
  events: CalendarEvent[];
  onClose: () => void;
  onPressEvent: (event: CalendarEvent) => void;
  onCreate: (date: Date) => void;
}

function MonthDaySheetImpl({
  visible, date, events, onClose, onPressEvent, onCreate,
}: Props) {
  const { colors, radius } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const { formatTime } = useTimeFormat();
  const reduceMotion = useReduceMotion();

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
    >
      <View
        style={[styles.backdrop, { backgroundColor: colors.scrim }]}
        accessibilityViewIsModal
        importantForAccessibility="yes"
      >
        <AnimatedPressable
          animated={false}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel={t('common.close')}
        />
        <View
          testID="month-day-sheet"
          onStartShouldSetResponder={() => true}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Typography variant="caption" color="secondary">
                {date ? dayjs(date).locale(language).format('dddd') : ''}
              </Typography>
              <Typography variant="h4" numberOfLines={1}>
                {date ? dayjs(date).locale(language).format('LL') : ''}
              </Typography>
            </View>
            <AnimatedPressable
              testID="month-day-sheet-close"
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={styles.closeButton}
            >
              <Icon size={22}>
                <X size={22} color={colors.textSecondary} />
              </Icon>
            </AnimatedPressable>
          </View>

          {events.length === 0 ? (
            <Typography variant="body1" color="secondary" style={styles.empty}>
              {t('calendar.noEvents')}
            </Typography>
          ) : (
            <FlatList
              data={events}
              style={styles.list}
              keyExtractor={(event, index) =>
                `${event.calendarId}-${event.uid}-${event.dtstart.getTime()}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  testID={`month-list-event-${item.calendarId}-${item.uid}-${item.dtstart.getTime()}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.summary || t('calendar.noTitle')}, ${
                    item.allDay
                      ? t('calendar.allDay')
                      : `${formatTime(item.dtstart)} – ${formatTime(item.dtend)}`
                  }`}
                  style={[styles.eventRow, { backgroundColor: colors.surface }]}
                  onPress={() => onPressEvent(item)}
                >
                  <View style={[styles.colorBar, { backgroundColor: item.color }]} />
                  <View style={styles.eventInfo}>
                    <Typography variant="body1" numberOfLines={1}>
                      {item.summary || t('calendar.noTitle')}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      {item.allDay
                        ? t('calendar.allDay')
                        : `${formatTime(item.dtstart)} – ${formatTime(item.dtend)}`}
                    </Typography>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
            />
          )}

          <Button
            testID="month-day-sheet-new"
            variant="primary"
            title={t('event.newEvent')}
            onPress={() => date && onCreate(date)}
          />
        </View>
      </View>
    </Modal>
  );
}

export const MonthDaySheet = memo(MonthDaySheetImpl);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '68%',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: { flex: 1, gap: 2 },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
  list: { flexGrow: 0, flexShrink: 1 },
  listContent: { gap: 8, paddingBottom: 2 },
  eventRow: {
    minHeight: 56,
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
  },
  colorBar: { width: 4 },
  eventInfo: { flex: 1, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  empty: { paddingVertical: 20, textAlign: 'center' },
});
