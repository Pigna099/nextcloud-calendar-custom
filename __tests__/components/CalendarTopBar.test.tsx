import React from 'react';
import { fireEvent, render as rtlRender } from '@testing-library/react-native';
import { ThemeWrapper } from '../helpers/theme';
import { CalendarTopBar } from '@/features/calendar/components/CalendarTopBar';

const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: ThemeWrapper });

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

describe('CalendarTopBar', () => {
  it('exposes drawer, today and one selectable chip per mode', () => {
    const { getByTestId } = render(
      <CalendarTopBar headerTitle="Sep" isToday={false} viewMode="month" onOpenDrawer={() => {}} onOpenSearch={() => {}} onToday={() => {}} onSwitchMode={() => {}} />,
    );
    expect(getByTestId('calendar-drawer-open')).toBeTruthy();
    expect(getByTestId('calendar-search-open')).toBeTruthy();
    expect(getByTestId('calendar-today')).toBeTruthy();
    expect(getByTestId('calendar-mode-month').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('calendar-mode-week').props.accessibilityState.selected).toBe(false);
    for (const mode of ['3days', 'day', 'schedule']) expect(getByTestId(`calendar-mode-${mode}`)).toBeTruthy();
  });

  it('opens search from the header', () => {
    const onOpenSearch = jest.fn();
    const { getByTestId } = render(
      <CalendarTopBar headerTitle="Sep" isToday={false} viewMode="month" onOpenDrawer={() => {}} onOpenSearch={onOpenSearch} onToday={() => {}} onSwitchMode={() => {}} />,
    );
    fireEvent.press(getByTestId('calendar-search-open'));
    expect(onOpenSearch).toHaveBeenCalledTimes(1);
  });
});
