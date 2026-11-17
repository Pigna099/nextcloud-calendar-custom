import React from 'react';
import { StyleSheet } from 'react-native';
import { render as rtlRender } from '@testing-library/react-native';
import { ThemeWrapper } from '../helpers/theme';
import { darkTheme, lightTheme } from '@/theme';
import Chip from '@/ui/components/Chip';
import { contrastRatio } from '@/utils/color';

const render = (ui: React.ReactElement, theme = lightTheme) =>
  rtlRender(ui, { wrapper: ({ children }) => <ThemeWrapper theme={theme}>{children}</ThemeWrapper> });

describe('Chip', () => {
  it('exposes testID and selected state', () => {
    const { getByTestId } = render(<Chip testID="c" active>Month</Chip>);
    expect(getByTestId('c').props.accessibilityState).toEqual({ selected: true, disabled: false });
  });

  it('uses tonal AA selection in both schemes', () => {
    for (const theme of [lightTheme, darkTheme]) {
      const { getByTestId, getByText } = render(<Chip testID="c" active>Month</Chip>, theme);
      const box = StyleSheet.flatten(getByTestId('c').props.style) as Record<string, unknown>;
      const label = StyleSheet.flatten(getByText('Month').props.style) as Record<string, unknown>;
      expect(box.backgroundColor).toBe(theme.colors.primarySoft);
      expect(label.color).toBe(theme.colors.primarySoftText);
      expect(contrastRatio(label.color as string, box.backgroundColor as string)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('picks dark ink for a light custom active color', () => {
    const { getByText } = render(<Chip active activeColor="#ffe066">Month</Chip>);
    expect((StyleSheet.flatten(getByText('Month').props.style) as Record<string, unknown>).color).toBe('#09101a');
  });

  it('uses a control-strength border when inactive', () => {
    const { getByTestId } = render(<Chip testID="c">Month</Chip>);
    const box = StyleSheet.flatten(getByTestId('c').props.style) as Record<string, unknown>;
    expect(box.borderColor).toBe(lightTheme.colors.borderStrong);
    expect(box.backgroundColor).toBe(lightTheme.colors.chip);
  });
});
