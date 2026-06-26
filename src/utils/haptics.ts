/**
 * Haptics utility — wraps expo-haptics and respects the user's
 * `hapticsEnabled` setting. Call setHapticsEnabled() from useSettings
 * whenever the preference changes so all call-sites stay in sync.
 */
import * as Haptics from 'expo-haptics';

// Re-export enums so call-sites can do: H.ImpactFeedbackStyle.Light
export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = Haptics.NotificationFeedbackType;

let _enabled = true;

/** Called by useSettings whenever the hapticsEnabled setting changes. */
export function setHapticsEnabled(v: boolean): void {
  _enabled = v;
}

export function isHapticsEnabled(): boolean {
  return _enabled;
}

export function selectionAsync(): void {
  if (!_enabled) return;
  Haptics.selectionAsync().catch(() => {});
}

export function impactAsync(style: Haptics.ImpactFeedbackStyle): void {
  if (!_enabled) return;
  Haptics.impactAsync(style).catch(() => {});
}

export function notificationAsync(type: Haptics.NotificationFeedbackType): void {
  if (!_enabled) return;
  Haptics.notificationAsync(type).catch(() => {});
}
