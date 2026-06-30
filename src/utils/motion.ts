import { Easing } from 'react-native';

export const duration = {
  instant:  0,   // reduced-motion path, skip-to-end
  micro:    120, // tap feedback, tab indicators
  quick:    180, // dots, chips, small state changes
  standard: 220, // pickers, sections, cards
  enter:    280, // content blocks, screen-level enters
  loop:     750, // spinners only — constant speed, low visual intensity
} as const;

// Fast deceleration — elements arriving into place
export const easeEnter = Easing.out(Easing.cubic);

// Fast departure — attention is already moving on
export const easeExit = Easing.in(Easing.quad);

// Symmetric — visible state changes (tab indicators, toggles)
export const easeState = Easing.inOut(Easing.quad);

// Constant — continuous loops, no deceleration cue
export const easeLoop = Easing.linear;
