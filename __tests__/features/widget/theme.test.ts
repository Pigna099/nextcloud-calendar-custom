import { darkTheme, lightTheme, type Theme } from '@/theme';
import { onEventColor, widgetPalette } from '@/features/widget/core/theme';
import { contrastRatio, pickInk } from '@/utils/color';

const fields = [
  'background',
  'surface',
  'surfaceRaised',
  'text',
  'textSecondary',
  'textTertiary',
  'border',
  'borderStrong',
  'primary',
  'onPrimary',
  'primarySoft',
  'primarySoftBorder',
  'primarySoftText',
  'talk',
  'danger',
  'onDanger',
  'warning',
  'onWarning',
] as const;

describe.each([
  ['light', lightTheme],
  ['dark', darkTheme],
] as [string, Theme][])('widget palette (%s)', (scheme, theme) => {
  it('matches the app theme values', () => {
    const palette = widgetPalette(scheme as 'light' | 'dark');
    for (const field of fields) {
      expect(palette[field]).toBe(theme.colors[field]);
    }
  });

  it('keeps widget text at WCAG AA on the widget surfaces', () => {
    const palette = widgetPalette(scheme as 'light' | 'dark');
    for (const surface of ['background', 'surface', 'surfaceRaised'] as const) {
      for (const text of ['text', 'textSecondary', 'textTertiary'] as const) {
        expect(contrastRatio(palette[text], palette[surface])).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe('onEventColor', () => {
  it('uses WCAG contrast instead of a brightness cutoff', () => {
    const bright = onEventColor('#ffe066');
    const deep = onEventColor('#0b3d66');
    expect(bright).toBe('#09101a');
    expect(deep).toBe('#ffffff');
    expect(contrastRatio(bright, '#ffe066')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(deep, '#0b3d66')).toBeGreaterThanOrEqual(4.5);
  });

  it('agrees with the shared pickInk helper', () => {
    for (const color of ['#0082c9', '#e9322d', '#3b82f6', '#ffffff', '#000000']) {
      expect(onEventColor(color)).toBe(pickInk(color));
    }
  });
});
