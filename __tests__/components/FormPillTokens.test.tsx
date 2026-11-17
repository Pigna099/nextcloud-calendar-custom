import React from 'react';
import { StyleSheet } from 'react-native';
import { render as rtlRender, within } from '@testing-library/react-native';
import { ThemeWrapper } from '../helpers/theme';
import { darkTheme, lightTheme, type Theme } from '@/theme';
import { AlarmOffsetPicker } from '@/features/notifications/AlarmOffsetPicker';
import { AlertPicker } from '@/features/event/components/AlertPicker';
import { contrastRatio } from '@/utils/color';

const render = (ui: React.ReactElement, theme: Theme = lightTheme) =>
  rtlRender(ui, { wrapper: ({ children }) => <ThemeWrapper theme={theme}>{children}</ThemeWrapper> });

function pillStyle(pill: { props: { style?: unknown } }) {
  return StyleSheet.flatten(pill.props.style as never) as Record<string, unknown>;
}

describe.each([
  ['light', lightTheme],
  ['dark', darkTheme],
] as [string, Theme][])('form pill tokens (%s)', (_name, theme) => {
  it('renders alarm presets with tonal selected surfaces and readable ink', () => {
    const { getByTestId } = render(
      <AlarmOffsetPicker values={[15]} onChange={jest.fn()} testIDPrefix="alarm" />,
      theme,
    );

    const selected = getByTestId('alarm-15');
    const selectedStyle = pillStyle(selected);
    expect(selectedStyle.backgroundColor).toBe(theme.colors.primarySoft);
    expect(selectedStyle.borderColor).toBe(theme.colors.primarySoftText);

    const selectedLabel = within(selected).getByText(/\S/);
    const selectedLabelStyle = StyleSheet.flatten(selectedLabel.props.style) as Record<string, unknown>;
    expect(selectedLabelStyle.color).toBe(theme.colors.primarySoftText);
    expect(
      contrastRatio(selectedLabelStyle.color as string, theme.colors.primarySoft),
    ).toBeGreaterThanOrEqual(4.5);

    const idleStyle = pillStyle(getByTestId('alarm-60'));
    expect(idleStyle.backgroundColor).toBe(theme.colors.chip);
    expect(idleStyle.borderColor).toBe(theme.colors.borderStrong);
  });

  it('renders the Default/None exclusives with the same tonal treatment', () => {
    const { getByTestId } = render(<AlertPicker value={[]} onChange={jest.fn()} />, theme);

    const none = getByTestId('event-form-alert-none');
    const noneStyle = pillStyle(none);
    expect(noneStyle.backgroundColor).toBe(theme.colors.primarySoft);
    expect(noneStyle.borderColor).toBe(theme.colors.primarySoftText);

    const noneLabel = within(none).getByText(/\S/);
    const noneLabelStyle = StyleSheet.flatten(noneLabel.props.style) as Record<string, unknown>;
    expect(noneLabelStyle.color).toBe(theme.colors.primarySoftText);

    const defaultStyle = pillStyle(getByTestId('event-form-alert-default'));
    expect(defaultStyle.backgroundColor).toBe(theme.colors.chip);
    expect(defaultStyle.borderColor).toBe(theme.colors.borderStrong);
  });
});
