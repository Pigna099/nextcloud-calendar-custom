import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronsUpDown, Settings } from 'lucide-react-native';
import { useTheme } from 'expo-router';

import { AvatarImage } from '@/components/AvatarImage';
import { AccountSwitcher } from '@/features/account/components/AccountSwitcher';
import { AnimatedPressable, Item, List, SectionHeader, Stack, Typography } from '@/ui/components';
import { useReduceMotion } from '@/features/calendar/hooks/useReduceMotion';
import type { Account, CalendarMeta } from '@/types';

import { CalendarDrawerRow } from './CalendarDrawerRow';

interface CalendarDrawerProps {
  open: boolean;
  drawerAnim: Animated.Value;
  overlayAnim: Animated.Value;
  drawerWidth: number;
  insets: { top: number };
  activeAccount: Account | null;
  calendars: CalendarMeta[];
  hiddenCalendarIds: string[];
  notifDisabledCalendarIds: string[];
  toggleCalendarVisibility: (id: string) => void;
  toggleCalendarNotifications: (id: string) => void;
  onClose: () => void;
  onNavigateSettings: () => void;
}

const CLOSE_ANIMATION_MS = 300;

export function CalendarDrawer({
  open,
  drawerAnim,
  overlayAnim,
  drawerWidth,
  insets,
  activeAccount,
  calendars,
  hiddenCalendarIds,
  notifDisabledCalendarIds,
  toggleCalendarVisibility,
  toggleCalendarNotifications,
  onClose,
  onNavigateSettings,
}: CalendarDrawerProps) {
  const { colors, radius } = useTheme();
  const { t } = useTranslation();
  const safeInsets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  // Keep the modal mounted while the slide-out animation runs. Closing the
  // native Modal immediately would cut the animation short.
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const timeout = setTimeout(() => setMounted(false), reduceMotion ? 0 : CLOSE_ANIMATION_MS);
    return () => clearTimeout(timeout);
  }, [open, mounted, reduceMotion]);

  if (!open && !mounted) return null;

  const openSettings = () => {
    // Navigating away does not need the slide-out animation; unmount first so
    // the modal cannot linger over the Settings screen.
    setMounted(false);
    onClose();
    onNavigateSettings();
  };

  return (
    <Modal
      visible
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modal} pointerEvents={open ? 'auto' : 'none'}>
        <Animated.View
          testID="calendar-drawer-scrim"
          style={[styles.overlay, { opacity: overlayAnim, backgroundColor: colors.scrim }]}
        >
          <Pressable
            testID="calendar-drawer-backdrop"
            accessible={false}
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View
          testID="calendar-drawer-panel"
          accessibilityViewIsModal={open}
          onAccessibilityEscape={onClose}
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              transform: [{ translateX: drawerAnim }],
              paddingTop: insets.top + 12,
              backgroundColor: colors.surface,
              borderTopRightRadius: radius.lg,
              borderBottomRightRadius: radius.lg,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.header}>
            <AccountSwitcher
              trigger={
                <Item
                  testID="calendar-drawer-account"
                  leading={activeAccount ? <AvatarImage account={activeAccount} size={40} /> : undefined}
                  title={
                    <Typography variant="body1" numberOfLines={1} ellipsizeMode="tail">
                      {activeAccount?.displayName ?? activeAccount?.username ?? '—'}
                    </Typography>
                  }
                  description={
                    <Typography variant="caption" color="secondary" numberOfLines={1} ellipsizeMode="middle">
                      {activeAccount?.username ?? ''}
                    </Typography>
                  }
                  trailing={<ChevronsUpDown size={20} color={colors.textTertiary} />}
                />
              }
            />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 }]}
            showsVerticalScrollIndicator={false}
          >
            <SectionHeader title={t('calendar.drawerCalendars')} />
            {calendars.length === 0 ? (
              <Stack padding={[8, 4]}>
                <Typography variant="caption" color="secondary">
                  {t('calendar.drawerNoCalendars')}
                </Typography>
              </Stack>
            ) : (
              <List>
                {calendars.map((cal) => (
                  <CalendarDrawerRow
                    key={cal.id}
                    calendar={cal}
                    visible={!hiddenCalendarIds.includes(cal.id)}
                    notifies={!notifDisabledCalendarIds.includes(cal.id)}
                    onToggleVisibility={() => toggleCalendarVisibility(cal.id)}
                    onToggleNotifications={() => toggleCalendarNotifications(cal.id)}
                  />
                ))}
              </List>
            )}
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                borderTopColor: colors.border,
                paddingBottom: Math.max(safeInsets.bottom, 8),
              },
            ]}
          >
            <AnimatedPressable
              testID="calendar-drawer-settings"
              accessibilityRole="button"
              accessibilityLabel={t('settings.title')}
              onPress={openSettings}
              style={styles.settingsRow}
            >
              <Settings size={20} color={colors.textSecondary} />
              <Typography variant="body1">{t('settings.title')}</Typography>
            </AnimatedPressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: 'transparent' },
  overlay: { ...StyleSheet.absoluteFill },
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.16, shadowRadius: 10, elevation: 10,
  },
  header: { paddingBottom: 12 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 12 },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footer: { borderTopWidth: StyleSheet.hairlineWidth },
});
