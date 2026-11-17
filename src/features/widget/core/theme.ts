import { pickInk } from '@/utils/color';

export type WidgetScheme = 'light' | 'dark';

type Hex = `#${string}`;

/**
 * Widget palettes mirror the app theme's calm surfaces and semantic on-colours.
 * Keep these values in sync with `src/theme.ts` and with the local palettes in
 * `surfaces/homeWidget/homeWidget.ios.tsx` (the widget function is serialized
 * separately, so it carries its own copy).
 */
export interface WidgetPalette {
  background: Hex;
  surface: Hex;
  surfaceRaised: Hex;
  text: Hex;
  textSecondary: Hex;
  textTertiary: Hex;
  border: Hex;
  borderStrong: Hex;
  primary: Hex;
  onPrimary: Hex;
  primarySoft: Hex;
  primarySoftBorder: Hex;
  primarySoftText: Hex;
  talk: Hex;
  danger: Hex;
  onDanger: Hex;
  warning: Hex;
  onWarning: Hex;
}

const light: WidgetPalette = {
  background: '#f5f7f9',
  surface: '#ffffff',
  surfaceRaised: '#ffffff',
  text: '#171b20',
  textSecondary: '#4d5761',
  textTertiary: '#626d79',
  border: '#e2e7ec',
  borderStrong: '#7f8791',
  primary: '#08679c',
  onPrimary: '#ffffff',
  primarySoft: '#e7eff5',
  primarySoftBorder: '#c5d9e6',
  primarySoftText: '#0a5d8c',
  talk: '#0077b8',
  danger: '#b8322a',
  onDanger: '#ffffff',
  warning: '#9a5700',
  onWarning: '#ffffff',
};

const dark: WidgetPalette = {
  background: '#0e1114',
  surface: '#171b20',
  surfaceRaised: '#20262d',
  text: '#edf1f4',
  textSecondary: '#b3bec8',
  textTertiary: '#8e9aa5',
  border: '#2b333c',
  borderStrong: '#68727e',
  primary: '#6cc7f5',
  onPrimary: '#0b1220',
  primarySoft: '#152a36',
  primarySoftBorder: '#244554',
  primarySoftText: '#9dd4f3',
  talk: '#5bb9e8',
  danger: '#f08a84',
  onDanger: '#2a0b09',
  warning: '#f0c37a',
  onWarning: '#2a1c05',
};

export function widgetPalette(scheme: WidgetScheme): WidgetPalette {
  return scheme === 'dark' ? dark : light;
}

/** WCAG-picked ink for solid event-coloured widget/Live Activity surfaces. */
export function onEventColor(color: string): Hex {
  return pickInk(color) as Hex;
}

export const widgetRadius = { sm: 8, md: 12, lg: 16 } as const;
export const widgetSpacing = { xs: 4, sm: 8, md: 12, lg: 16 } as const;
export const widgetType = { time: 12, caption: 13, body: 15, title: 17, heading: 22 } as const;
