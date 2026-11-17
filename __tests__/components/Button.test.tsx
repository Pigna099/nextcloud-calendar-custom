import React from 'react';
import { StyleSheet } from 'react-native';
import { render as rtlRender, fireEvent } from '@testing-library/react-native';
import { ThemeWrapper } from '../helpers/theme';
import { darkTheme, lightTheme } from '@/theme';
import Button from '@/ui/components/Button';
import { contrastRatio } from '@/utils/color';

const render = (ui: React.ReactElement, theme = lightTheme) =>
  rtlRender(ui, { wrapper: ({ children }) => <ThemeWrapper theme={theme}>{children}</ThemeWrapper> });

function colorsOf(node: { props: { style?: unknown } }) {
  return StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;
}

describe('Button', () => {
  it('renders the solid primary CTA with its on-primary ink', () => {
    const { getByText, getByTestId } = render(<Button testID="cta" title="Save" onPress={() => {}} />);
    const box = colorsOf(getByTestId('cta'));
    const label = colorsOf(getByText('Save'));

    expect(box.backgroundColor).toBe(lightTheme.colors.primary);
    expect(label.color).toBe(lightTheme.colors.onPrimary);
    expect(contrastRatio(label.color as string, box.backgroundColor as string)).toBeGreaterThanOrEqual(4.5);

    fireEvent.press(getByTestId('cta'));
  });

  it('uses dark ink on the bright dark-mode primary instead of hardcoding white', () => {
    const { getByText, getByTestId } = render(<Button testID="cta" title="Save" />, darkTheme);
    const box = colorsOf(getByTestId('cta'));
    const label = colorsOf(getByText('Save'));

    expect(box.backgroundColor).toBe(darkTheme.colors.primary);
    expect(label.color).toBe(darkTheme.colors.onPrimary);
    expect(label.color).not.toBe('#ffffff');
    expect(contrastRatio(label.color as string, box.backgroundColor as string)).toBeGreaterThanOrEqual(4.5);
  });

  it('offers a soft variant that uses the soft accent tokens', () => {
    const { getByText, getByTestId } = render(<Button testID="soft" variant="soft" title="More" />);
    const box = colorsOf(getByTestId('soft'));
    const label = colorsOf(getByText('More'));

    expect(box.backgroundColor).toBe(lightTheme.colors.primarySoft);
    expect(box.borderColor).toBe(lightTheme.colors.primarySoftText);
    expect(label.color).toBe(lightTheme.colors.primarySoftText);
    expect(contrastRatio(box.borderColor as string, lightTheme.colors.background)).toBeGreaterThanOrEqual(3);
  });

  it('uses on-danger and on-warning for filled semantic buttons', () => {
    const danger = render(<Button testID="danger" color="danger" title="Delete" />);
    expect(colorsOf(danger.getByText('Delete')).color).toBe(lightTheme.colors.onDanger);
    expect(colorsOf(danger.getByTestId('danger')).backgroundColor).toBe(lightTheme.colors.danger);

    const warning = render(<Button testID="warning" color="warning" title="Careful" />);
    expect(colorsOf(warning.getByText('Careful')).color).toBe(lightTheme.colors.onWarning);
    expect(colorsOf(warning.getByTestId('warning')).backgroundColor).toBe(lightTheme.colors.warning);
  });

  it('gives secondary buttons a 3:1 control boundary', () => {
    const { getByTestId } = render(<Button testID="secondary" variant="secondary" title="Cancel" />);
    const box = colorsOf(getByTestId('secondary'));
    expect(box.borderColor).toBe(lightTheme.colors.borderStrong);
    expect(contrastRatio(lightTheme.colors.borderStrong, lightTheme.colors.surface)).toBeGreaterThanOrEqual(3);
  });
});
