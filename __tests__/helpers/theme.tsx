import React from 'react';
import { ThemeProvider } from 'expo-router';
import { lightTheme, type Theme } from '../../src/theme';

export function ThemeWrapper({ children, theme = lightTheme }: { children: React.ReactNode; theme?: Theme }) {
  return <ThemeProvider value={theme}>{children}</ThemeProvider>;
}
