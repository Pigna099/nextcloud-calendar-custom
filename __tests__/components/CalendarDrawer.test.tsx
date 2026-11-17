import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { fireEvent, render as rtlRender } from '@testing-library/react-native';

import '@/utils/i18n';
import { ThemeWrapper } from '../helpers/theme';
import { lightTheme } from '@/theme';
import { List } from '@/ui/components';
import { CalendarDrawer } from '@/features/calendar/components/CalendarDrawer';
import type { Account, CalendarMeta } from '@/types';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@/components/AvatarImage', () => ({ AvatarImage: () => null }));

const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: ThemeWrapper });

const account: Account = {
  id: 'acc-1',
  displayName: 'Ada Lovelace',
  baseUrl: 'https://example.com',
  username: 'ada',
  appPassword: 'secret',
  davUserId: 'ada',
};

const calendar: CalendarMeta = {
  id: 'cal-1',
  accountId: 'acc-1',
  displayName: 'Personal',
  color: '#ff0000',
  ctag: '1',
  url: 'https://example.com/personal',
  slug: 'personal',
};

function renderDrawer(overrides: Partial<React.ComponentProps<typeof CalendarDrawer>> = {}) {
  return render(
    <CalendarDrawer
      open
      drawerAnim={new Animated.Value(0)}
      overlayAnim={new Animated.Value(1)}
      drawerWidth={320}
      insets={{ top: 44 }}
      activeAccount={account}
      calendars={[calendar]}
      hiddenCalendarIds={[]}
      notifDisabledCalendarIds={[]}
      toggleCalendarVisibility={() => {}}
      toggleCalendarNotifications={() => {}}
      onClose={() => {}}
      onNavigateSettings={() => {}}
      {...overrides}
    />,
  );
}

describe('CalendarDrawer', () => {
  it('exposes Settings directly instead of hiding it in the account menu', () => {
    const onClose = jest.fn();
    const onNavigateSettings = jest.fn();
    const { getByTestId } = renderDrawer({ onClose, onNavigateSettings });

    const settings = getByTestId('calendar-drawer-settings');
    expect(settings.props.accessibilityRole).toBe('button');
    fireEvent.press(settings);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onNavigateSettings).toHaveBeenCalledTimes(1);
  });

  it('keeps the account row available for account switching', () => {
    const { getByTestId, getByText } = renderDrawer();
    expect(getByTestId('calendar-drawer-account')).toBeTruthy();
    expect(getByText('Ada Lovelace')).toBeTruthy();
  });

  it('renders the account row flat, without a card around it', () => {
    const { UNSAFE_queryAllByType } = renderDrawer({ calendars: [] });
    expect(UNSAFE_queryAllByType(List)).toHaveLength(0);
  });

  it('renders a lighter scrim and a rounded drawer edge', () => {
    const { getByTestId } = renderDrawer();
    expect(StyleSheet.flatten(getByTestId('calendar-drawer-scrim', { includeHiddenElements: true }).props.style).backgroundColor)
      .toBe(lightTheme.colors.scrim);
    expect(StyleSheet.flatten(getByTestId('calendar-drawer-panel').props.style)).toMatchObject({
      borderTopRightRadius: lightTheme.radius.lg,
      borderBottomRightRadius: lightTheme.radius.lg,
    });
  });

  it('marks the drawer as a modal and closes from the backdrop or accessibility escape', () => {
    const onClose = jest.fn();
    const { getByTestId } = renderDrawer({ onClose });
    const panel = getByTestId('calendar-drawer-panel');

    expect(panel.props.accessibilityViewIsModal).toBe(true);
    panel.props.onAccessibilityEscape();
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('calendar-drawer-backdrop', { includeHiddenElements: true }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders nothing while fully closed', () => {
    const { queryByTestId } = renderDrawer({ open: false });
    expect(queryByTestId('calendar-drawer-panel')).toBeNull();
  });
});
