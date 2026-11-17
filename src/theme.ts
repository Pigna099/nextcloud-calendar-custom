import type { TextStyle } from 'react-native';
import { DefaultTheme } from 'expo-router';

export type ColorScheme = 'light' | 'dark';

export interface ThemeFontStyle {
  fontFamily: string;
  fontWeight: TextStyle['fontWeight'];
}

export interface ThemeFonts {
  regular: ThemeFontStyle;
  medium: ThemeFontStyle;
  bold: ThemeFontStyle;
  heavy: ThemeFontStyle;
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderSubtle: string;
  /** Control boundary with at least 3:1 contrast against nearby surfaces. */
  borderStrong: string;
  primary: string;
  /** @deprecated Prefer onPrimary. Kept for existing navigation/calendar code. */
  primaryText: string;
  onPrimary: string;
  primarySoft: string;
  primarySoftBorder: string;
  primarySoftText: string;
  talk: string;
  onTalk: string;
  talkSoft: string;
  talkSoftBorder: string;
  talkSoftText: string;
  danger: string;
  onDanger: string;
  dangerSoft: string;
  dangerSoftBorder: string;
  dangerSoftText: string;
  warning: string;
  onWarning: string;
  warningSoft: string;
  warningSoftBorder: string;
  warningSoftText: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarInactive: string;
  headerBackground: string;
  chip: string;
  chipActive: string;
  card: string;
  notification: string;
  item: string;
  /** Colour for native shadows (kept opaque so platforms can animate it). */
  shadow: string;
  /** Backdrop behind modals and sheets. */
  scrim: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeRadius {
  sm: number;
  md: number;
  lg: number;
  pill: number;
}

export interface ThemeTypography {
  caption: number;
  body: number;
  title: number;
  heading: number;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  typography: ThemeTypography;
}


declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Theme {
      dark: boolean;
      colors: ThemeColors;
      fonts: ThemeFonts;
      spacing: ThemeSpacing;
      radius: ThemeRadius;
      typography: ThemeTypography;
    }
  }
}

const spacing: ThemeSpacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
const radius: ThemeRadius = { sm: 8, md: 12, lg: 16, pill: 999 };
const typography: ThemeTypography = { caption: 13, body: 15, title: 17, heading: 22 };
const fonts: ThemeFonts = DefaultTheme.fonts;

const lightColors: ThemeColors = {
  background: '#f5f7f9',
  surface: '#ffffff',
  surfaceRaised: '#ffffff',
  text: '#171b20',
  textSecondary: '#4d5761',
  textTertiary: '#626d79',
  border: '#e2e7ec',
  borderSubtle: '#edf0f3',
  borderStrong: '#7f8791',
  primary: '#08679c',
  primaryText: '#ffffff',
  onPrimary: '#ffffff',
  primarySoft: '#e7eff5',
  primarySoftBorder: '#c5d9e6',
  primarySoftText: '#0a5d8c',
  talk: '#0077b8',
  onTalk: '#ffffff',
  talkSoft: '#e6f1f8',
  talkSoftBorder: '#c2d9e8',
  talkSoftText: '#006392',
  danger: '#b8322a',
  onDanger: '#ffffff',
  dangerSoft: '#fbeceb',
  dangerSoftBorder: '#efc9c5',
  dangerSoftText: '#a1271f',
  warning: '#9a5700',
  onWarning: '#ffffff',
  warningSoft: '#fbf2e2',
  warningSoftBorder: '#ead6b4',
  warningSoftText: '#855000',
  tabBar: '#ffffff',
  tabBarBorder: '#e2e7ec',
  tabBarInactive: '#626d79',
  headerBackground: '#f5f7f9',
  chip: '#eef2f5',
  chipActive: '#08679c',
  card: '#ffffff',
  notification: '#b8322a',
  item: '#ffffff',
  shadow: '#0b1220',
  scrim: 'rgba(8, 12, 18, 0.38)',
};

const darkColors: ThemeColors = {
  background: '#0e1114',
  surface: '#171b20',
  surfaceRaised: '#20262d',
  text: '#edf1f4',
  textSecondary: '#b3bec8',
  textTertiary: '#8e9aa5',
  border: '#2b333c',
  borderSubtle: '#20262d',
  borderStrong: '#68727e',
  primary: '#6cc7f5',
  primaryText: '#0b1220',
  onPrimary: '#0b1220',
  primarySoft: '#152a36',
  primarySoftBorder: '#244554',
  primarySoftText: '#9dd4f3',
  talk: '#5bb9e8',
  onTalk: '#08202e',
  talkSoft: '#142a35',
  talkSoftBorder: '#24475a',
  talkSoftText: '#8fd0f4',
  danger: '#f08a84',
  onDanger: '#2a0b09',
  dangerSoft: '#2d1a1a',
  dangerSoftBorder: '#4a2a28',
  dangerSoftText: '#f3b4ae',
  warning: '#f0c37a',
  onWarning: '#2a1c05',
  warningSoft: '#2b2416',
  warningSoftBorder: '#443a22',
  warningSoftText: '#f0c98a',
  tabBar: '#12161a',
  tabBarBorder: '#2b333c',
  tabBarInactive: '#8e9aa5',
  headerBackground: '#0e1114',
  chip: '#20262d',
  chipActive: '#6cc7f5',
  card: '#1a1f25',
  notification: '#f08a84',
  item: '#1b2026',
  shadow: '#000000',
  scrim: 'rgba(0, 0, 0, 0.62)',
};

export const lightTheme: Theme = { dark: false, colors: lightColors, fonts, spacing, radius, typography };
export const darkTheme: Theme = { dark: true, colors: darkColors, fonts, spacing, radius, typography };
