# Evidence — Design Is Audit: Mica

All findings below are from four parallel subagent reports (Structural, Visual, Copy & Honesty, Weight & Friction). Visual findings are marked INFERRED (static source read, no running instance driven this pass). Accessibility subagent was skipped (no running instance to test keyboard/focus behavior at runtime; focus-state findings folded into Visual).

## 1. Structural Evidence

- **Interactive elements app-wide:** 59 distinct source call sites (50 across 11 screens + 9 across shared components). Several are `.map()`-multiplied at runtime (e.g. 8 interest pills, 6 color swatches, 5 filter chips).
- **Deepest nesting:** 8 levels — `EventDetailScreen.tsx:110` → `ScrollView(113)` → `View(136)` → `LifeCalendarGrid` → `ScrollView(LifeCalendarGrid.tsx:26)` → `View(grid:27)` → `View(weekCol:29)` → `View(cell:51)`.
- **Repeated patterns found app-wide (11 families):**
  1. "Bloom" decorative circle — recurs on nearly every screen (Splash, Home ×3, Events, EventDetail ×2, AddEvent ×2, Settings ×2, Invite ×2, AuthChoice) — 15+ occurrences, purely decorative.
  2. "Card" container — reused everywhere but with **3 divergent border-radii for the same concept**: r28 (HomeScreen), r24 (Events/EventDetail/Settings/Invite), r20 (AddEventScreen).
  3. "Back" navigation row — implemented independently 3× (OnboardingScreen.tsx:192, EventDetailScreen.tsx:119, InviteScreen.tsx:87), no shared component.
  4. "Skip this step" text link — 4 occurrences in onboarding flow alone.
  5. Selectable chip/pill/card toggle — implemented independently 6+ times (OnboardingScreen interests/theme/color ×3, AddEventScreen type-chips/ColorSwatch ×2, EventsScreen filter-chips), no shared component.
  6. "Coming soon" Alert — 6 call sites (AuthChoiceScreen ×3, SettingsScreen ×3) — all dead-end taps presented as functional buttons.
  7. List-row pattern (color-bar/icon + title/subtitle + trailing value) — implemented independently 6× (HomeScreen, EventsScreen's own EventRow, CalendarView, EventDetailScreen Details rows, SettingsScreen About rows, InviteScreen Friend rows) — no shared component despite identical shape.
  8. Empty-state card (emoji + muted text + accent CTA) — implemented independently 3× (HomeScreen.tsx:181-189, EventsScreen.tsx:243-253, CalendarView.tsx:217-228), near-verbatim duplicates.
  9. Primary CTA button style — reused 5+ places, mostly consistent.
  10. **Theme-picker control implemented twice with divergent UI** for the identical feature: OnboardingScreen.tsx:353-390 (swatch-preview cards) vs SettingsScreen.tsx:115-138 (plain segmented buttons).
  11. Icon-badge (rounded-square + Ionicons glyph) — 7+ occurrences in SettingsScreen alone.
- **Dead code found:**
  - `EventsScreen.tsx:399-415` — a full block of `StyleSheet` keys (`eventRow`, `eventRowBorder`, `colorBar`, `eventInfo`, `eventTitle`, `eventDate`, `eventRight`, `daysLeft`) defined but **never referenced** anywhere in the render (rows actually use `EventRow`'s own separate `rowStyles`).
  - `InviteScreen.tsx:24-28,124` — "Message" and "More" share buttons render as styled `TouchableOpacity` but have `onPress={undefined}` — no handler exists at all.
  - `InviteScreen.tsx:166-171` — "Add from contacts" `TouchableOpacity` has **no `onPress` prop whatsoever** — a fully dead affordance.

## 2. Visual Evidence (INFERRED — static source read)

- **Spacing scale:** No token module exists (`src/theme/` contains only `palette.ts` + `ThemeContext.tsx`, no spacing/typography/radii file). **26 distinct ad-hoc spacing values** found inline across screens (0, 1.8, 2, 3, 4, 5, 6, 8, 10, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 60, 80, and a −4 negative margin).
- **Type scale:** No typography token module. **18 distinct fontSize values** found inline (11–64px), no declared scale, no custom font family anywhere (default system font throughout).
- **Color count:** Theme defines 26 tokens (13 keys × 2 palettes: `mica`/`midnight`, `src/theme/palette.ts`). But **16 hardcoded hex values found directly in screen/component styles**, outside the token system — 10 are exact re-typed duplicates of existing tokens (e.g. `#9F7A45` re-typed instead of referencing `mica.accentStrong`), 4 are true net-new colors never declared in the palette (`#FFF7EC`, `#6B7FA4`, `#8A6BA4`, plus a hardcoded `#000`/`#FFFFFF` pair). `ErrorBoundary.tsx` hardcodes the entire light palette by value rather than importing tokens (documented intentional, to survive a ThemeContext crash).
- **Contrast:** Worst confirmed *actually-rendered* pairing — hardcoded label color `#FFF7EC` against `midnight.accentStrong` (`#F0CF9A`) = **1.40:1** (used on view-toggle/CTA buttons whenever dark mode is active, e.g. `EventsScreen.tsx:159-169`; near-invisible light-on-light text). Second pairing — same `#FFF7EC` CTA text against `mica.accentStrong` (`#9F7A45`) in light mode = **3.70:1**, which **fails WCAG AA (4.5:1)** for normal-weight 16px text (`PitchScreen.tsx:552` vs `:462`). Root cause: label color is hardcoded rather than using the theme-aware `t.onAccent` token, which would resolve correctly in both palettes.
- **States checklist:**
  - Empty — present (HomeScreen, EventsScreen, CalendarView)
  - Loading — present (HomeScreen, EventsScreen, EventDetailScreen `ActivityIndicator`)
  - Error — **partial/rough**: only a native `Alert.alert('Error', ...)` on save failure (`AddEventScreen.tsx:246-249`); no in-UI styled error state/banner/inline validation anywhere in the app.
  - Success — **partial/rough**: no persistent success confirmation UI anywhere; only an ephemeral "Copied!" button-label swap (`InviteScreen.tsx:107-111`).
  - Focus — **present in only 1 of 4 `TextInput` instances** (`OnboardingScreen.tsx:246-259` name field has focus-driven border color; `AddEventScreen.tsx:287-295` and `:408-416`, and `OnboardingScreen.tsx:486-493` have no focus styling at all).
  - Disabled — present (`AddEventScreen.tsx:270-271` Save button opacity, `OnboardingScreen.tsx:204-217` renderCTA, `SettingsScreen.tsx:228` About rows).

## 3. Copy & Honesty Evidence

- **Inflations:** None found. Copy is consistently restrained across all 11 screens (no "best/powerful/amazing/effortless/seamless/revolutionary" language located).
- **Dark patterns found:**
  - **Fabricated social proof** — `InviteScreen.tsx:18-22` hardcodes a `FRIENDS` array ("Jamie R." — Joined, "Priya K." — Pending, "Tom L." — Pending) with no data-fetching logic; renders unconditionally as if it were the user's real invite history. A brand-new user with zero invites sees three fake "invited friends."
  - **Unfulfillable reward promise** — `InviteScreen.tsx:114-116` promises "Your friend gets Mica free for 30 days. You unlock a premium month when they join," and `:176-177` states "Referral credits apply... Terms apply." No billing/premium system exists anywhere in the codebase — `PremiumContext.tsx:23` hardcodes `isPremium = false` with an explicit comment "Phase 2: wire to ConfigCat + billing." The app promises a reward it currently has no mechanism to grant.
  - **Dangling terms reference** — `InviteScreen.tsx:177` — "Terms apply." is styled in link-accent color but is plain non-interactive `<Text>`, with no linked terms document anywhere.
  - **Unbacked pricing claim** — `SettingsScreen.tsx:83` states "One-time purchase, lifetime access." as the premium pricing model, but the "Unlock Mica Premium" button (`:96-103`) only triggers a "Coming soon" alert (`:98-100`) — no purchase flow exists to honor the stated terms.
  - Fake scarcity/countdown timers: none found. Confirmshaming: none found (decline copy is neutral throughout: "Skip", "Not now", "I'll decide later").
- **Jargon/unclear labels:** "Daily nudge" (`SettingsScreen.tsx:155`) is ambiguous — unclear whether distinct from per-event reminders. Minor "COLOUR" (`OnboardingScreen.tsx:511`) vs "COLOR" (`AddEventScreen.tsx:387`) spelling inconsistency.
- **Label→behavior mismatches:** Two dead-end buttons discovered (see Structural #6 above: `InviteScreen.tsx:124` Message/More buttons, `:166-171` Add from contacts) — labels imply an action; no handler exists at all, so tapping does nothing. All other checked handlers (Cancel/Save/Delete flows) match their labels correctly.

## 4. Weight & Friction Evidence

- **Dependencies:** 21 runtime deps, reasonable for an Expo/RN app (SQLite, navigation, gesture-handler, notifications, Sentry, clipboard, haptics — no bloat like heavy animation/UI-kit libraries found).
- **Network:** Zero HTTP/fetch/network calls anywhere in `src/` — fully local SQLite persistence (`expo-sqlite`). Strong for both privacy-honesty and environmental cost.
- **Redundant DB queries on initial mount:** MainScreen keeps Home/Events/Settings all mounted simultaneously (`display:none` toggling, not unmount) per `MainScreen.tsx:23-30`; each independently calls its own `useEvents()` → `repo.getAll()`, meaning the same `SELECT * FROM events...` query fires 2-3× in parallel on cold start with no shared cache, plus a separate `PremiumContext` count query and a `SplashScreen` settings-lookup query — **6 total blocking `await` points stacked on the cold-start critical path.**
- **Artificial delay:** `SplashScreen.tsx:64,82-87` enforces a **hard-coded 1.5s minimum splash duration** (`MIN_SPLASH_MS = 1500`) regardless of how fast the DB actually loads — a deliberate, unconditional friction point on every single app launch.
- **Animation:** Only **one** indefinitely-looping animation exists app-wide — the Splash screen spinner (`SplashScreen.tsx:36,45-54`), which is transient (~1.5s+) and pre-Home. The Home/Main idle screen itself uses only one-shot entrance animations (`YearGrid.tsx`, `AnimatedMountView.tsx`) — no idle-looping motion on the primary screen. `useReducedMotion` is respected in Splash/Pitch/AddEvent.
- **Modals/alerts on initial load:** Zero — no Modal/Alert/Toast auto-fires on mount of Splash, Onboarding, Main, or Home.
- **Bundle size:** Not directly measurable (no compiled bundle/APK found in repo); node_modules disk footprint ≈149MB is a weak proxy only, not real shipped-bytecode size.

## Known Gaps

- No live device/simulator screenshots were captured this pass — all visual findings are INFERRED from source.
- True Time-to-Interactive and actual shipped bundle size could not be measured without a running build.
- `OnboardingScreen.tsx`'s exact trigger point for the notification-permission request (mount vs. button tap) was not fully confirmed.
- Sentry SDK's own background network calls (if any) were not located in source (likely config-driven via `app.json`).
