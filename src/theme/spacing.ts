// Shared spacing and radius scale. Screens previously scattered 26 distinct
// ad-hoc spacing values with no shared source of truth — this is the
// deliberate, small scale new and migrated code should draw from instead.
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// One radius for the "card" concept app-wide, replacing the 20/24/28 split
// found across HomeScreen, AddEventScreen, and the rest of the app.
export const radius = {
  sm: 8,
  md: 14,
  card: 24,
  pill: 999,
} as const;
