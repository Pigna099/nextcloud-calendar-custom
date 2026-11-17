import React from 'react';
import { StyleSheet } from 'react-native';
import { render as rtlRender, fireEvent } from '@testing-library/react-native';
import { ThemeWrapper } from '../helpers/theme';
import { lightTheme } from '@/theme';
import { CalendarFab } from '@/features/calendar/components/CalendarFab';

const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: ThemeWrapper });

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@/utils/nativeTabs', () => ({ nativeTabsEnabled: () => false }));

describe('CalendarFab', () => {
  it('exposes the calendar-fab-new testID and forwards presses', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<CalendarFab onPress={onPress} />);
    fireEvent.press(getByTestId('calendar-fab-new'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses a calm tonal surface for the primary action', () => {
    const { getByTestId } = render(<CalendarFab onPress={jest.fn()} />);
    const style = StyleSheet.flatten(getByTestId('calendar-fab-new').props.style);
    expect(style.backgroundColor).toBe(lightTheme.colors.primarySoft);
    expect(style.borderColor).toBe(lightTheme.colors.primarySoftBorder);
    expect(style.shadowColor).toBe(lightTheme.colors.shadow);
  });
});
