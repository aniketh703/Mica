import { Easing } from 'react-native';

export const MOTION_DURATION = {
  tab: 150,
  dot: 180,
  picker: 220,
  section: 220,
  card: 240,
  content: 280,
  spinner: 750,
} as const;

export const motionEasing = Easing.out(Easing.cubic);
