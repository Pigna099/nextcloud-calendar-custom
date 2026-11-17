import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render as rtlRender } from '@testing-library/react-native';
import { Bell, BellOff } from 'lucide-react-native';

import { ThemeWrapper } from '../helpers/theme';
import { lightTheme } from '@/theme';
import { CalendarDrawerRow } from '@/features/calendar/components/CalendarDrawerRow';
import type { CalendarMeta } from '@/types';

const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: ThemeWrapper });

const calendar: CalendarMeta = {
  id: 'cal-1',
  accountId: 'acc-1',
  displayName: 'Personal',
  color: '#ff0000',
  ctag: '1',
  url: 'https://example.com/personal',
  slug: 'personal',
};

function renderRow(overrides: Partial<React.ComponentProps<typeof CalendarDrawerRow>> = {}) {
  return render(
    <CalendarDrawerRow
      calendar={calendar}
      visible
      notifies
      onToggleVisibility={() => {}}
      onToggleNotifications={() => {}}
      {...overrides}
    />,
  );
}

describe('CalendarDrawerRow', () => {
  it('renders a neutral bell when notifications are enabled', () => {
    const { UNSAFE_getByType } = renderRow();
    expect(UNSAFE_getByType(Bell).props.color).toBe(lightTheme.colors.textSecondary);
  });

  it('mutes the bell when notifications are disabled', () => {
    const { UNSAFE_getByType } = renderRow({ notifies: false });
    expect(UNSAFE_getByType(BellOff).props.color).toBe(lightTheme.colors.textTertiary);
  });

  it('mutes the bell when the calendar is hidden', () => {
    const { UNSAFE_getByType } = renderRow({ visible: false });
    expect(UNSAFE_getByType(BellOff).props.color).toBe(lightTheme.colors.textTertiary);
  });

  it('gives the notification button a 44pt target and keeps toggles working', () => {
    const onToggleNotifications = jest.fn();
    const { getByTestId } = renderRow({ onToggleNotifications });
    const bell = getByTestId('calendar-drawer-notifications-Personal');

    expect(StyleSheet.flatten(bell.props.style)).toMatchObject({ width: 44, height: 44 });
    expect(bell.props.accessibilityRole).toBe('switch');
    fireEvent.press(bell);
    expect(onToggleNotifications).toHaveBeenCalledTimes(1);
  });
});
