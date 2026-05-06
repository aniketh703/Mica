// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { mica, midnight, Theme } from './palette';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  t: Theme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  t: mica,
  mode: 'system',
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system');
  const scheme = useColorScheme();
  const resolved = mode === 'system' ? scheme : mode;
  const t = resolved === 'dark' ? midnight : mica;
  return (
    <ThemeContext.Provider value={{ t, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext).t;
}

export function useThemeMode() {
  const { mode, setMode } = useContext(ThemeContext);
  return { mode, setMode };
}
