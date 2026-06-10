# Mica — Motion Design Implementation Spec
**Date:** 2026-06-10  
**Scope:** Full audit — 3 Critical, 4 Important, 4 Opportunities  
**Library:** react-native-reanimated (free, open-source)  
**Source audit:** `motion-audits/mica-2026-06-10.html`

---

## Context

Mica is a calm personal calendar app (React Native 0.83 / Expo 55). The motion audit found that every state change in the app snaps instantly — no enter/exit animations anywhere — and the one existing animation (SplashScreen spinner) has no reduced-motion accessibility guard. This spec covers all 11 findings from the audit in priority order.

---

## Architecture

### New dependency
```
npx expo install react-native-reanimated
```
Add `react-native-reanimated/plugin` to `babel.config.js` plugins array. Requires a native build (EAS build or `expo run:ios` / `expo run:android`) — not compatible with Expo Go tunnel after install.

### New shared utilities: `src/hooks/useReduceMotion.ts`
A single hook that wraps `AccessibilityInfo.isReduceMotionEnabled()` and subscribes to `reduceMotionChanged` events. Returns a boolean. Used by every animation in the codebase to decide whether to animate or snap to final state.

```ts
export function useReduceMotion(): boolean
```

No other shared animation helpers are needed — Reanimated's `withTiming` / `withSpring` patterns are clean enough to inline per component.

---

## Changes by file

### 1. `src/screens/onboarding/SplashScreen.tsx` — Critical + Opportunity
**Finding 1 (Critical):** Infinite spinner has no reduced-motion guard.  
**Opportunity:** Spinner duration 1000ms → 750ms.

- Import `useReduceMotion` hook.
- Replace `Animated.loop(Animated.timing(spinValue, ...))` with Reanimated `useSharedValue` + `withRepeat(withTiming(..., { duration: 750 }), -1)`.
- Gate the entire loop start behind `!reduceMotion`. When reduced motion is on, show the spinner as a static element (no rotation).
- Subscribe to runtime changes via the hook (already handled inside `useReduceMotion`).

### 2. `src/screens/HomeScreen.tsx` — Critical (×2) + Important + Opportunity
**Finding 2 (Critical):** Loading → content snaps.  
**Finding 3 (Critical):** Next Up card ↔ empty state snaps.  
**Finding 6 (Important):** "More coming up" section appears/disappears instantly.  
**Opportunity:** Countdown number tick enter on screen focus.

- **Loading enter:** After `loading` flips false, animate the entire scroll view's container: `opacity 0→1`, `translateY 10→0`, 280ms, `Easing.out(Easing.cubic)`. Gate behind `!reduceMotion`.
- **Card state swap:** Wrap both `next ?` branches in individual `Animated.View`s keyed per state. On mount of each card, animate: `opacity 0→1`, `scale 0.96→1`, 240ms. Gate behind `!reduceMotion`.
- **"More coming up" enter:** Animate the section mount: `opacity 0→1`, `translateY 10→0`, 220ms, 60ms delay. Exit can be instant (Jakub: exits can be subtler). Gate behind `!reduceMotion`.
- **Countdown tick:** On screen focus (existing `navigation.addListener('focus', ...)` already present), animate the countdown number: `opacity 0→1`, `translateY -6→0`, 200ms. Only if not reduced motion.

### 3. `src/components/TabBar.tsx` — Important
**Finding 4 (Important):** Tab active state has no transition.

- Add `useReduceMotion` import.
- Per tab: use `useSharedValue(isActive ? 1 : 0)` for opacity. On press, `withTiming(1, { duration: 150 })` for the becoming-active tab. Keep font weight snap — React Native cannot interpolate `fontWeight`.
- Gate behind `!reduceMotion` (instant if reduce-motion on).

### 4. `src/screens/onboarding/PitchScreen.tsx` — Important + Opportunity
**Finding 5 (Important):** Pagination dots swap size/color instantly.  
**Opportunity:** Per-pane content entrance on scroll.

- **Dots:** Per dot, use `useSharedValue` driven by `currentPage`. `withTiming` on `scale` (0.75→1) and `opacity` (0.35→1), 180ms. Gate behind `!reduceMotion`.
- **Pane content entrance:** All panes are pre-mounted inside the `ScrollView` simultaneously, so mount-based animation won't work. Instead, react to `currentPage` changes: when a pane's index matches `currentPage`, trigger a Reanimated `withTiming` sequence on that pane's shared values (opacity 0→1, translateY 8→0, 220ms, staggered 0/40/80ms for eyebrow/title/body). Reset to 0 on `currentPage` change away. Gate behind `!reduceMotion`.

### 5. `src/screens/AddEventScreen.tsx` — Important + Opportunity
**Finding 7 (Important):** Date picker appears instantly on iOS.  
**Opportunity:** Color swatch selection scale pulse.

- **Date picker:** Wrap `DateTimePicker` in an `Animated.View` (iOS only — Android uses native dialog). On `showDatePicker` true, animate `opacity 0→1` and `maxHeight 0→210` over 220ms. Use `LayoutAnimation.configureNext` for the height change. Gate behind `!reduceMotion && Platform.OS === 'ios'`.
- **Color swatch pulse:** On swatch press, trigger a one-shot `scale 1→1.08→1` animation on the selected swatch, 150ms. Gate behind `!reduceMotion`.

### 6. `src/components/YearGrid.tsx` — Opportunity
**Opportunity:** Year grid dot entrance stagger on first paint.

- On `YearGrid` first mount only (use `useRef(false)` to track), stagger the dots from past→today→future. Each dot gets `opacity 0→1` with `delay = index * 0.6ms` (capped at 400ms total for 365 dots). Gate behind `!reduceMotion`. Only first mount — no animation on navigation/refresh.

### 7. `src/hooks/useReduceMotion.ts` — New file (Critical dependency)
- `AccessibilityInfo.isReduceMotionEnabled()` async call on mount, default `false`.
- `AccessibilityInfo.addEventListener('reduceMotionChanged', cb)` for runtime updates.
- Return the boolean. Used by all 6 files above.

---

## Implementation order

1. Install Reanimated + configure Babel
2. Create `useReduceMotion` hook (all other files depend on it)
3. SplashScreen (critical + opportunity, isolated)
4. HomeScreen (critical ×2 + important + opportunity, highest-impact file)
5. TabBar (important, small file)
6. PitchScreen (important + opportunity)
7. AddEventScreen (important + opportunity)
8. YearGrid (opportunity, purely additive)

---

## Constraints

- All animations gated behind `useReduceMotion()` — no exceptions.
- Reanimated animations run on the UI thread by default — no `useNativeDriver` flag needed (that flag is a bare Animated API concept).
- Height animation in AddEventScreen (date picker) uses `LayoutAnimation` (not Reanimated) — the only place in the codebase where a layout property is animated, because the native picker has a dynamic height that can't be measured ahead of time. `LayoutAnimation` is a bare RN API separate from Reanimated.
- No Reanimated animations on keyboard-initiated actions (Emil's rule).
- Year grid stagger fires on first mount only — never on navigation or pull-to-refresh.

---

## Out of scope

- No changes to navigation transitions (platform defaults are fine).
- No changes to EventDetailScreen, EventsScreen, SettingsScreen, InviteScreen (not in audit findings).
- No changes to data layer, hooks, or services.
