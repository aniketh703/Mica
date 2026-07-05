import { ThemeMode } from './ThemeContext';

// Shared source of truth for the 3 theme modes. Previously OnboardingScreen
// and SettingsScreen each declared their own separate mode/label list —
// consolidated here so they can't drift out of sync. Each screen still
// renders its own visual treatment (rich preview cards vs. compact segmented
// buttons), since those interaction weights are deliberately different for
// a first-run choice vs. a quick settings toggle.
export const THEME_MODE_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];
