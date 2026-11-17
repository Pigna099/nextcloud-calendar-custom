import React from 'react';
import { Switch } from 'react-native';
import { render as rtlRender } from '@testing-library/react-native';
import { ThemeWrapper } from '../helpers/theme';
import { darkTheme, lightTheme } from '@/theme';
import Toggle from '@/ui/components/Toggle';

const render = (ui: React.ReactElement, theme = lightTheme) =>
  rtlRender(ui, { wrapper: ({ children }) => <ThemeWrapper theme={theme}>{children}</ThemeWrapper> });

describe('Toggle', () => {
  it('uses theme-aware track and thumb colours', () => {
    const { UNSAFE_getByType, rerender } = render(<Toggle testID="toggle" value />);
    expect(UNSAFE_getByType(Switch).props.trackColor).toEqual({
      false: lightTheme.colors.borderStrong,
      true: lightTheme.colors.primary,
    });
    expect(UNSAFE_getByType(Switch).props.thumbColor).toBe(lightTheme.colors.onPrimary);

    rerender(<Toggle testID="toggle" value={false} />);
    expect(UNSAFE_getByType(Switch).props.thumbColor).toBe(lightTheme.colors.surfaceRaised);
  });

  it('does not hardcode a white thumb on the bright dark-mode primary', () => {
    const { UNSAFE_getByType } = render(<Toggle testID="toggle" value />, darkTheme);
    expect(UNSAFE_getByType(Switch).props.thumbColor).toBe(darkTheme.colors.onPrimary);
    expect(UNSAFE_getByType(Switch).props.thumbColor).not.toBe('#ffffff');
  });
});
