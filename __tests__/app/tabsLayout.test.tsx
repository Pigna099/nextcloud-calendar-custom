import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import '@/utils/i18n';
import { lightTheme } from '@/theme';

const mockCaptured: {
  screenOptions?: Record<string, unknown>;
  screens: Array<{ name: string; options: Record<string, any> }>;
} = { screens: [] };

jest.mock('@/utils/nativeTabs', () => ({ nativeTabsEnabled: () => false }));
jest.mock('expo-router/unstable-native-tabs', () => ({ NativeTabs: () => null }));
jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');

  function Tabs({ children, screenOptions }: any) {
    mockCaptured.screenOptions = screenOptions;
    return React.createElement(View, { testID: 'tabs' }, children);
  }
  Tabs.Screen = ({ name, options }: any) => {
    mockCaptured.screens.push({ name, options });
    return React.createElement(View, { testID: options.tabBarButtonTestID });
  };

  return {
    Tabs,
    useTheme: () => require('../../src/theme').lightTheme,
  };
});

import TabsLayout from '../../app/(tabs)/_layout';

describe('tabs layout', () => {
  beforeEach(() => {
    mockCaptured.screens = [];
    mockCaptured.screenOptions = undefined;
  });

  it('preserves the tab testIDs used by E2E flows', () => {
    const { getByTestId } = render(<TabsLayout />);
    expect(getByTestId('tabs')).toBeTruthy();
    expect(getByTestId('tab-calendar')).toBeTruthy();
    expect(getByTestId('tab-settings')).toBeTruthy();
  });

  it('uses quiet, neutral tab chrome with a tonal active icon', () => {
    render(<TabsLayout />);

    expect(mockCaptured.screenOptions).toMatchObject({
      tabBarActiveTintColor: lightTheme.colors.primary,
      tabBarInactiveTintColor: lightTheme.colors.tabBarInactive,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
    });
    expect((mockCaptured.screenOptions?.tabBarStyle as Record<string, unknown>).borderTopWidth)
      .toBe(StyleSheet.hairlineWidth);

    const calendarTab = mockCaptured.screens.find((screen) => screen.name === 'calendar/index');
    expect(calendarTab).toBeTruthy();
    const activeIcon = calendarTab!.options.tabBarIcon({
      color: lightTheme.colors.primary,
      focused: true,
    });
    const { getByTestId } = render(activeIcon);
    expect(StyleSheet.flatten(getByTestId('tab-icon-calendar').props.style)).toMatchObject({
      backgroundColor: lightTheme.colors.primarySoft,
      borderRadius: lightTheme.radius.pill,
    });
  });
});
