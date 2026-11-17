import React from 'react';
import { Text } from 'react-native';
import { render as rtlRender } from '@testing-library/react-native';
import { ThemeWrapper } from '../helpers/theme';
import { darkTheme, lightTheme } from '@/theme';
import Icon from '@/ui/components/Icon';

const render = (ui: React.ReactElement, theme = lightTheme) =>
  rtlRender(ui, { wrapper: ({ children }) => <ThemeWrapper theme={theme}>{children}</ThemeWrapper> });

function Glyph({ color, size }: { color?: string; size?: number }) {
  return <Text testID="glyph" style={{ color }}>{String(size)}</Text>;
}

describe('Icon', () => {
  it('uses theme text ink when no chip background is given', () => {
    const { getByTestId } = render(<Icon><Glyph /></Icon>);
    expect(getByTestId('glyph').props.style.color).toBe(lightTheme.colors.text);
  });

  it('picks readable ink for a chip background instead of always white', () => {
    const lightChip = render(<Icon color={lightTheme.colors.primary}><Glyph /></Icon>);
    expect(lightChip.getByTestId('glyph').props.style.color).toBe(lightTheme.colors.onPrimary);

    const brightChip = render(<Icon color="#ffe066"><Glyph /></Icon>);
    expect(brightChip.getByTestId('glyph').props.style.color).toBe('#09101a');

    const darkPrimary = render(<Icon color={darkTheme.colors.primary}><Glyph /></Icon>, darkTheme);
    expect(darkPrimary.getByTestId('glyph').props.style.color).toBe(darkTheme.colors.onPrimary);
  });
});
