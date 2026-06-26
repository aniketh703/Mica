# Motion Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 4 remaining motion-design Opportunity items from the 2026-06-10 audit; all Critical/Important findings were already shipped.

**Architecture:** All animations use RN's `Animated` API — already wired in the codebase with `useReducedMotion()`, `MOTION_DURATION`, and `motionEasing`. No new dependencies needed. Each task adds enter/stagger/pulse/entrance animation to one component.

**Tech Stack:** React Native `Animated` API, `useReducedMotion` hook (`src/hooks/useReducedMotion.ts`), `MOTION_DURATION` + `motionEasing` from `src/utils/motion.ts`.

---

## Context: What Is Already Done

The audit found 11 items (3 Critical, 4 Important, 4 Opportunities). Before this plan, the codebase already shipped:

| Finding | Status | Where |
|---------|--------|-------|
| Critical: Spinner no reduce-motion guard | ✅ Done | `SplashScreen.tsx` — `useReducedMotion()` + `Animated.loop` |
| Critical: Loading → content snaps | ✅ Done | `HomeScreen.tsx` — `useEnterAnimation`, opacity+translateY 280ms |
| Critical: Next Up ↔ empty state snaps | ✅ Done | `HomeScreen.tsx` — `AnimatedMountView` keyed by `next.id` |
| Important: Tab active state | ✅ Done | `TabBar.tsx` — `TabItem` cross-fade 150ms |
| Important: Pagination dots | ✅ Done | `PitchScreen.tsx` — `PageDot` scale+opacity 180ms |
| Important: "More coming up" section | ✅ Done | `HomeScreen.tsx` — `AnimatedMountView` opacity+translateY 220ms+60ms delay |
| Important: Date picker appears instantly (iOS) | ✅ Done | `AddEventScreen.tsx` — `LayoutAnimation` + opacity 220ms |
| Opportunity: Spinner 750ms | ✅ Done | `MOTION_DURATION.spinner = 750` |

**Remaining (this plan):**

| Opportunity | File | Details |
|-------------|------|---------|
| Countdown tick on focus | `HomeScreen.tsx` | opacity 0→1, translateY -6→0, 200ms on each navigation focus |
| PitchScreen pane text stagger | `PitchScreen.tsx` | eyebrow/title/body stagger 0/40/80ms, 220ms, on `currentPage` change |
| Color swatch pulse | `AddEventScreen.tsx` | scale 1→1.08→1, 150ms total, on press |
| YearGrid entrance | `YearGrid.tsx` | container opacity 0→1, translateY 6→0, 500ms, first resolve of `reduceMotion = false` |

---

## File Map

| File | Change |
|------|--------|
| `src/screens/HomeScreen.tsx` | Add `focusKey` state; increment on focus; wrap `countdownBlock` in `AnimatedMountView key={focusKey}` |
| `src/screens/onboarding/PitchScreen.tsx` | Extract `PaneTextBlock` component with staggered opacity+translateY on `isActive` change |
| `src/screens/AddEventScreen.tsx` | Extract `ColorSwatch` component with scale pulse on press |
| `src/components/YearGrid.tsx` | Add `Animated.View` container wrapper with entrance animation on first `reduceMotion = false` |

---

## Task 1: HomeScreen — Countdown Tick on Focus

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Add `focusKey` state and update focus listener**

  Current focus listener (line 122):
  ```tsx
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { refresh(); });
    return unsub;
  }, [navigation, refresh]);
  ```

  Replace with:
  ```tsx
  const [focusKey, setFocusKey] = useState(0);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      refresh();
      setFocusKey(k => k + 1);
    });
    return unsub;
  }, [navigation, refresh]);
  ```

  Add `focusKey` to the `useState` declarations after the existing ones near the top of `HomeScreen` (after `const [refreshing, setRefreshing] = useState(false);`).

- [ ] **Step 2: Wrap the countdown block in `AnimatedMountView`**

  In the `next ? (...)` branch, find `<View style={styles.countdownBlock}>` (line ~209) and wrap it:

  ```tsx
  <AnimatedMountView
    key={focusKey}
    config={{ duration: 200, fromTranslateY: -6 }}
  >
    <View style={styles.countdownBlock}>
      <Text style={[styles.countdownNum, { color: next.color }]}>
        {Math.max(0, effectiveDaysUntil(next))}
      </Text>
      <Text style={[styles.countdownLabel, { color: t.textMuted }]}>days</Text>
    </View>
  </AnimatedMountView>
  ```

  The `key={focusKey}` forces `AnimatedMountView` to remount (and re-run its enter animation) on each focus event. `AnimatedMountView` already calls `useReducedMotion()` internally, so the guard is automatic.

- [ ] **Step 3: Verify no TypeScript errors**

  Run: `npx tsc --noEmit`
  Expected: no new errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/screens/HomeScreen.tsx
  git commit -m "feat(motion): animate countdown number on screen focus"
  ```

---

## Task 2: PitchScreen — Pane Text Stagger on Page Change

**Files:**
- Modify: `src/screens/onboarding/PitchScreen.tsx`

- [ ] **Step 1: Add `PaneTextBlock` component above `PitchScreen`**

  Insert after the `PaneVisualComponent` function and before the `// ─── Main component` comment:

  ```tsx
  function PaneTextBlock({
    pane,
    isActive,
    reduceMotion,
  }: {
    pane: typeof PANES[number];
    isActive: boolean;
    reduceMotion: boolean;
  }) {
    const t = useTheme();
    const [eyebrowOpacity] = useState(() => new Animated.Value(isActive ? 1 : 0));
    const [eyebrowTranslate] = useState(() => new Animated.Value(isActive ? 0 : 8));
    const [titleOpacity] = useState(() => new Animated.Value(isActive ? 1 : 0));
    const [titleTranslate] = useState(() => new Animated.Value(isActive ? 0 : 8));
    const [bodyOpacity] = useState(() => new Animated.Value(isActive ? 1 : 0));
    const [bodyTranslate] = useState(() => new Animated.Value(isActive ? 0 : 8));

    useEffect(() => {
      if (!isActive) {
        eyebrowOpacity.setValue(0);
        eyebrowTranslate.setValue(8);
        titleOpacity.setValue(0);
        titleTranslate.setValue(8);
        bodyOpacity.setValue(0);
        bodyTranslate.setValue(8);
        return;
      }

      if (reduceMotion) {
        eyebrowOpacity.setValue(1);
        eyebrowTranslate.setValue(0);
        titleOpacity.setValue(1);
        titleTranslate.setValue(0);
        bodyOpacity.setValue(1);
        bodyTranslate.setValue(0);
        return;
      }

      const dur = MOTION_DURATION.section;
      const animations = [0, 40, 80].map((delay, i) => {
        const [op, tr] = [
          [eyebrowOpacity, eyebrowTranslate],
          [titleOpacity, titleTranslate],
          [bodyOpacity, bodyTranslate],
        ][i];
        return Animated.parallel([
          Animated.timing(op, { toValue: 1, duration: dur, delay, easing: motionEasing, useNativeDriver: true }),
          Animated.timing(tr, { toValue: 0, duration: dur, delay, easing: motionEasing, useNativeDriver: true }),
        ]);
      });

      animations.forEach(a => a.start());

      return () => animations.forEach(a => a.stop());
    }, [
      isActive,
      reduceMotion,
      eyebrowOpacity, eyebrowTranslate,
      titleOpacity, titleTranslate,
      bodyOpacity, bodyTranslate,
    ]);

    return (
      <>
        <Animated.Text
          style={[
            styles.eyebrow,
            { color: t.textMuted, opacity: eyebrowOpacity, transform: [{ translateY: eyebrowTranslate }] },
          ]}
        >
          {pane.eyebrow}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.title,
            { color: t.text, opacity: titleOpacity, transform: [{ translateY: titleTranslate }] },
          ]}
        >
          {pane.title}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.body,
            { color: t.textMuted, opacity: bodyOpacity, transform: [{ translateY: bodyTranslate }] },
          ]}
        >
          {pane.body}
        </Animated.Text>
      </>
    );
  }
  ```

- [ ] **Step 2: Call `useReducedMotion` in `PitchScreen` and replace inline pane text with `PaneTextBlock`**

  Inside `PitchScreen`, add at the top of the component body (after `const [currentPage, setCurrentPage] = useState(0);`):
  ```tsx
  const reduceMotion = useReducedMotion();
  ```

  In the `PANES.map` inside `<ScrollView>`, replace the three `<Text>` elements with `<PaneTextBlock>`:

  Current pane render:
  ```tsx
  {PANES.map((pane, index) => (
    <View key={index} style={[styles.pane, { width: SCREEN_WIDTH }]}>
      <Text style={[styles.eyebrow, { color: t.textMuted }]}>{pane.eyebrow}</Text>
      <Text style={[styles.title, { color: t.text }]}>{pane.title}</Text>
      <Text style={[styles.body, { color: t.textMuted }]}>{pane.body}</Text>
      <View style={styles.visualContainer}>
        <PaneVisualComponent visual={pane.visual} />
      </View>
    </View>
  ))}
  ```

  Replace with:
  ```tsx
  {PANES.map((pane, index) => (
    <View key={index} style={[styles.pane, { width: SCREEN_WIDTH }]}>
      <PaneTextBlock
        pane={pane}
        isActive={index === currentPage}
        reduceMotion={reduceMotion}
      />
      <View style={styles.visualContainer}>
        <PaneVisualComponent visual={pane.visual} />
      </View>
    </View>
  ))}
  ```

- [ ] **Step 3: Verify no TypeScript errors**

  Run: `npx tsc --noEmit`
  Expected: no new errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/screens/onboarding/PitchScreen.tsx
  git commit -m "feat(motion): stagger pane text on PitchScreen page change"
  ```

---

## Task 3: AddEventScreen — Color Swatch Scale Pulse

**Files:**
- Modify: `src/screens/AddEventScreen.tsx`

- [ ] **Step 1: Extract `ColorSwatch` component**

  Add this component near the top of the file, below the constants and above `AddEventScreen`:

  ```tsx
  function ColorSwatch({
    c,
    isSelected,
    onPress,
    reduceMotion,
    t,
  }: {
    c: string;
    isSelected: boolean;
    onPress: () => void;
    reduceMotion: boolean;
    t: ReturnType<typeof useTheme>;
  }) {
    const [scale] = useState(() => new Animated.Value(1));

    function handlePress() {
      onPress();
      if (!reduceMotion) {
        scale.setValue(1);
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.08, duration: 75, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 75, useNativeDriver: true }),
        ]).start();
      }
    }

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.swatchOuter,
          isSelected
            ? { borderColor: t.accentStrong, borderWidth: 2.5 }
            : { borderColor: 'transparent', borderWidth: 2.5 },
        ]}
      >
        <Animated.View style={[styles.swatch, { backgroundColor: c, transform: [{ scale }] }]} />
      </TouchableOpacity>
    );
  }
  ```

  `useTheme`'s return type is `Theme` from `src/theme/palette.ts`. The import `import { Theme } from '../theme/palette';` is already present in `TabBar.tsx` as a pattern, but `AddEventScreen` uses `useTheme` already — use the same type:

  ```tsx
  // Change the prop type annotation to:
  t: Theme;
  ```

  And add the import at the top if not already there:
  ```tsx
  import { Theme } from '../theme/palette';
  ```

- [ ] **Step 2: Replace inline swatch `TouchableOpacity` loop with `ColorSwatch`**

  Find the swatch render in the color card section (around line 332):
  ```tsx
  {COLOR_SWATCHES.map(c => (
    <TouchableOpacity
      key={c}
      onPress={() => setColor(c)}
      style={[
        styles.swatchOuter,
        color === c
          ? { borderColor: t.accentStrong, borderWidth: 2.5 }
          : { borderColor: 'transparent', borderWidth: 2.5 },
      ]}
    >
      <View style={[styles.swatch, { backgroundColor: c }]} />
    </TouchableOpacity>
  ))}
  ```

  Replace with:
  ```tsx
  {COLOR_SWATCHES.map(c => (
    <ColorSwatch
      key={c}
      c={c}
      isSelected={color === c}
      onPress={() => {
        H.selectionAsync();
        setColor(c);
      }}
      reduceMotion={reduceMotion}
      t={t}
    />
  ))}
  ```

- [ ] **Step 3: Verify no TypeScript errors**

  Run: `npx tsc --noEmit`
  Expected: no new errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/screens/AddEventScreen.tsx
  git commit -m "feat(motion): scale pulse on color swatch press"
  ```

---

## Task 4: YearGrid — Container Entrance on First Mount

**Files:**
- Modify: `src/components/YearGrid.tsx`

- [ ] **Step 1: Add imports and animation state**

  Update the imports to include `Animated`, `Easing`, and `useEffect`, `useRef`, `useState` from React:

  Current imports:
  ```tsx
  import React from 'react';
  import { View, StyleSheet } from 'react-native';
  ```

  Replace with:
  ```tsx
  import React, { useEffect, useRef, useState } from 'react';
  import { Animated, Easing, View, StyleSheet } from 'react-native';
  import { useReducedMotion } from '../hooks/useReducedMotion';
  ```

- [ ] **Step 2: Add animation logic inside `YearGrid`**

  After the `const cellSize = ...` line, add:

  ```tsx
  const reduceMotion = useReducedMotion();
  const hasAnimated = useRef(false);
  const [containerOpacity] = useState(() => new Animated.Value(0));
  const [containerTranslateY] = useState(() => new Animated.Value(6));

  useEffect(() => {
    if (hasAnimated.current) return;

    if (reduceMotion) {
      containerOpacity.setValue(1);
      containerTranslateY.setValue(0);
      return;
    }

    // reduceMotion resolved to false — animate once
    hasAnimated.current = true;
    containerOpacity.setValue(0);
    containerTranslateY.setValue(6);

    const anim = Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(containerTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    anim.start();
    return () => anim.stop();
  }, [reduceMotion, containerOpacity, containerTranslateY]);
  ```

  **Why `hasAnimated.current` check with `[reduceMotion]` deps:** `useReducedMotion` initializes to `true` (safe default) while the native async check resolves. When it changes to `false` (for non-reduce-motion users), the effect re-runs. Without the ref guard, we'd also re-animate if reduce motion settings change at runtime.

- [ ] **Step 3: Wrap the outer `View` container with `Animated.View`**

  Current return:
  ```tsx
  return (
    <View style={[styles.container, { width: gridWidth, gap: GAP }]}>
      {cells.map((cell) => { ... })}
    </View>
  );
  ```

  Replace with:
  ```tsx
  return (
    <Animated.View
      style={[
        styles.container,
        { width: gridWidth, gap: GAP },
        { opacity: containerOpacity, transform: [{ translateY: containerTranslateY }] },
      ]}
    >
      {cells.map((cell) => { ... })}
    </Animated.View>
  );
  ```

- [ ] **Step 4: Verify no TypeScript errors**

  Run: `npx tsc --noEmit`
  Expected: no new errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/YearGrid.tsx
  git commit -m "feat(motion): animate YearGrid container entrance on first mount"
  ```

---

## Self-Review Checklist

- [x] Spec coverage: all 4 remaining Opportunities have tasks
- [x] No placeholders: every step has complete code
- [x] Type consistency: `PANES[number]`, `Theme`, `useTheme` return type consistent across tasks
- [x] Reduce-motion gate: every animation is gated behind `useReducedMotion()` or `reduceMotion` prop
- [x] No Reanimated needed: all animations use existing `Animated` API pattern
- [x] No install steps: infrastructure already in place
