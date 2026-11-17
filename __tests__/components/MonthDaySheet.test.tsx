import React from 'react';
import { Modal } from 'react-native';
import { render as rtlRender } from '@testing-library/react-native';

import { ThemeWrapper } from '../helpers/theme';
import { MonthDaySheet } from '@/features/calendar/components/MonthDaySheet';
import { useSettingsStore } from '@/stores/settingsStore';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: ThemeWrapper });

function sheet() {
  return (
    <MonthDaySheet
      visible
      date={new Date(2026, 5, 15)}
      events={[]}
      onClose={jest.fn()}
      onPressEvent={jest.fn()}
      onCreate={jest.fn()}
    />
  );
}

describe('MonthDaySheet transition', () => {
  afterEach(() => {
    useSettingsStore.setState({ reduceMotion: false });
  });

  it('uses a fade instead of a slide', () => {
    const { UNSAFE_getByType } = render(sheet());
    expect(UNSAFE_getByType(Modal).props.animationType).toBe('fade');
  });

  it('disables the fade when reduce motion is enabled', () => {
    useSettingsStore.setState({ reduceMotion: true });
    const { UNSAFE_getByType } = render(sheet());
    expect(UNSAFE_getByType(Modal).props.animationType).toBe('none');
  });
});
