// Shared type scale. Screens previously scattered 18 distinct ad-hoc fontSize
// values with no declared scale — this is the deliberate set new and migrated
// code should draw from instead. "countdown*" sizes are the large hero
// numbers used for day-count displays (Home, EventDetail), kept distinct from
// the general reading scale since they serve a different purpose.
export const fontSize = {
  caption: 11,
  small: 13,
  body: 15,
  label: 16,
  subtitle: 18,
  title: 22,
  headline: 28,
  display: 34,
  countdownMedium: 52,
  countdownLarge: 64,
} as const;
