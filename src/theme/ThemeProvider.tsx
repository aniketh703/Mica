import React, {createContext, useContext, useMemo} from 'react';
import {ColorSchemeName, useColorScheme} from 'react-native';
import {useMicaStore} from '../store/useMicaStore';
import {palettes} from './palette';

type ThemePalette = (typeof palettes)[keyof typeof palettes];

type ThemeValue = {
  theme: ThemePalette;
  resolvedMode: Exclude<ColorSchemeName, null>;
  statusBarStyle: 'dark-content' | 'light-content';
};

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

export function ThemeProvider({
  children,
}: React.PropsWithChildren): JSX.Element {
  const systemMode = useColorScheme() ?? 'light';
  const preference = useMicaStore(state => state.theme.mode);

  const resolvedMode =
    preference === 'system' ? systemMode : preference === 'dark' ? 'dark' : 'light';

  const theme = resolvedMode === 'dark' ? palettes.midnight : palettes.mica;

  const value = useMemo<ThemeValue>(
    () => ({
      theme,
      resolvedMode,
      statusBarStyle:
        resolvedMode === 'dark' ? 'light-content' : 'dark-content',
    }),
    [resolvedMode, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
