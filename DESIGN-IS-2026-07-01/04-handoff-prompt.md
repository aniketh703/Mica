/make-plan Redesign Mica's design system and InviteScreen/Settings honesty layer. Current design failed audit at 15/30 with critical gaps in principles #3 (aesthetic, 1/3), #4 (understandable, 1/3), #6 (honest, 0/3), #8 (thorough, 1/3), #10 (as little design as possible, 1/3).

Verdict paragraph (quoted from 03-verdict.md):
> Mica's total score falls well below the 20-point REFINE threshold, and principle #6 (honest) scored 0 on a load-bearing dimension — the app fabricates social proof (fake "invited friends" on InviteScreen) and promises a referral reward with no backend to fulfill it — which alone mandates REDESIGN under the verdict rule, independent of the total.

Why redesign and not refine: #6 (honest) scored 0/3 — a load-bearing principle — because InviteScreen renders hardcoded fake friend/invite data as if real and promises a referral reward the app has no backend to grant. Total (15/30) is also below the 20-point REFINE floor, driven by a systemic lack of design tokens (no spacing/typography scale anywhere) and pervasive duplicated component implementations rather than one isolated screen.

Preserve from current design:
- Color-token system: 26 tokens across `mica`/`midnight` palettes in `src/theme/palette.ts` — the problem is values escaping the system (16 hardcoded hex duplicates/strays found across screens), not the palette itself.
- The countdown-centric visual concept: `YearGrid`, `LifeCalendarGrid`, and the day-count-first Home screen layout — this is the app's genuine differentiator (scored 2/3 on #1 innovative, the second-highest score in the audit). Do not replace this concept; only fix its execution details (contrast, states).
- The restrained, non-inflated copy voice — zero marketing-superlative violations were found across all 11 screens; keep this tone.
- The fully local, no-network architecture (`expo-sqlite` only, zero HTTP calls anywhere in `src/`) — strong foundation for honesty and environmental cost once the fabricated InviteScreen data is fixed.

Discard:
- Ad-hoc, un-tokenized spacing and typography. Evidence: no `spacing.ts`/`typography.ts` module exists in `src/theme/`; 26 distinct inline spacing values and 18 distinct inline fontSize values found across screens, with 3 divergent card border-radii (20/24/28) used for the same container concept. Caused failure on principle #3 (aesthetic).
- Hardcoded fake InviteScreen data and unfulfillable reward copy. Evidence: `InviteScreen.tsx:18-22` (hardcoded `FRIENDS` array rendered as real invite history), `InviteScreen.tsx:114-116,176-177` (referral reward promise with no backend — `PremiumContext.tsx:23` hardcodes `isPremium = false`, deferred to "Phase 2"). Caused failure on principle #6 (honest) — scored 0/3.
- Duplicated component implementations for identical features. Evidence: theme-picker built twice (`OnboardingScreen.tsx:353-390` vs `SettingsScreen.tsx:115-138`), color-swatch picker built twice (`OnboardingScreen.tsx:513-524` vs `AddEventScreen.tsx` `ColorSwatch:84-96`), list-row pattern implemented independently 6× (Home/Events/CalendarView/EventDetail/Settings/Invite), empty-state card implemented independently 3×. Caused failure on principle #10 (as little design as possible).
- Dead/non-functional interactive elements. Evidence: `EventsScreen.tsx:399-415` (unreferenced style block), `InviteScreen.tsx:124` (Message/More share buttons with `onPress={undefined}`), `InviteScreen.tsx:166-171` (Add from contacts button with no `onPress` at all). Caused failure on principles #4 (understandable) and #10.

Top 5 moves from the audit (verbatim):
1. #6 Honest: Remove the hardcoded fake `FRIENDS` array (`InviteScreen.tsx:18-22`) that renders fabricated invite history as if real, and either build the referral-reward backend or strip the unfulfillable "free for 30 days / unlock a premium month" promise (`InviteScreen.tsx:114-116`) until `PremiumContext.tsx:23`'s billing integration actually exists. Evidence: `InviteScreen.tsx:18-22`, `:114-116`, `:176-177`; `PremiumContext.tsx:23`.
2. #4 Understandable / #10 As little design as possible: Wire up or delete the two fully dead buttons that look tappable but have no handler: "Message"/"More" share buttons (`InviteScreen.tsx:124`) and "Add from contacts" (`InviteScreen.tsx:166-171`). Evidence: `InviteScreen.tsx:24-28,124,166-171`.
3. #3 Aesthetic: Introduce real `spacing.ts` and `typography.ts` token modules to replace the 26 ad-hoc spacing values and 18 ad-hoc fontSize values found inline across screens, and collapse the 3 divergent card border-radii (20/24/28) into one. Route the 16 hardcoded hex colors (10 of which duplicate existing tokens) through `palette.ts` instead of re-typing values. Evidence: no token module exists in `src/theme/` beyond `palette.ts`.
4. #8 Thorough: Build a real in-UI error state (replace the bare `Alert.alert('Error', ...)` at `AddEventScreen.tsx:246-249`) and a persistent success confirmation pattern, and extend focus styling from the one `TextInput` that has it (`OnboardingScreen.tsx:246-259`) to the other three that don't (`AddEventScreen.tsx:287-295`, `:408-416`; `OnboardingScreen.tsx:486-493`). Fix the theme-aware text-on-fill contrast bug: hardcoded `#FFF7EC` label color against `midnight.accentStrong` (`#F0CF9A`) resolves to 1.40:1 in dark mode — replace with the existing `t.onAccent` token.
5. #10 As little design as possible: Extract the theme-picker (duplicated at `OnboardingScreen.tsx:353-390` vs `SettingsScreen.tsx:115-138`), the color-swatch picker (duplicated at `OnboardingScreen.tsx:513-524` vs `AddEventScreen.tsx` `ColorSwatch:84-96`), and the list-row pattern (independently implemented 6× across Home/Events/CalendarView/EventDetail/Settings/Invite) into shared components. Delete the dead style block at `EventsScreen.tsx:399-415`.

Redesign principles in priority order:
1. #6 Honest — every claim and rendered data point maps 1:1 to real app state; no fabricated "friends," no reward promises without a fulfillment mechanism, and unbuilt features ("Coming soon" flows) are visually distinguished from live ones rather than presented identically to functional buttons.
2. #3 Aesthetic — a single declared spacing scale and type scale drive every screen, so the existing card/bloom/list-row visual language (which already reads as coherent) becomes systemically consistent instead of independently re-approximated per screen.
3. #10 As little design as possible — one shared implementation per interaction pattern (list-row, theme-picker, color-picker, empty-state, back-row) instead of 2-6 independent copies, with all dead/unreferenced code removed.

Deliverables for the plan:
- New token modules: `src/theme/spacing.ts`, `src/theme/typography.ts` (scale derived from the most-used existing values, not invented from scratch), plus an audit pass replacing hardcoded hex colors with `palette.ts` references.
- Shared components extracted for: list-row, theme-picker, color-swatch-picker, empty-state card, back-navigation-row — each screen migrated to consume the shared version, deleting the screen-local duplicate.
- InviteScreen honesty fix: either a real (even minimal) referral-tracking data path, or the friend list and reward copy removed/clearly marked unavailable until Phase 2 billing lands; "Terms apply" either links to real terms or is removed.
- States checklist: in-UI error component, persistent success confirmation pattern, focus styling applied to all 4 TextInput instances app-wide.
- Contrast fix: replace hardcoded `#FFF7EC` text-on-accent-fill with the theme-aware `t.onAccent` token everywhere it currently appears (confirmed sites: `EventsScreen.tsx`, `AddEventScreen.tsx`, `OnboardingScreen.tsx`, `PitchScreen.tsx`, `InviteScreen.tsx`, `CalendarView.tsx`).
- Dead-code removal: `EventsScreen.tsx:399-415` unused styles; either wire up or delete `InviteScreen.tsx` Message/More/Add-from-contacts buttons.
- Migration path: since this redesign preserves data model, palette, and the core countdown concept, it can land incrementally screen-by-screen behind normal PR review — no user-facing migration or data conversion needed (local SQLite schema untouched).
- Cutover criteria: old ad-hoc styles retired screen-by-screen as each is migrated to the new token modules and shared components; InviteScreen fake-data removal ships as its own PR independent of the token work, since it's the highest-severity (honesty) fix.

Anti-patterns to guard against (specific to REDESIGN):
- Porting the old ad-hoc spacing/type values into the new token files just to make them "official" — derive the scale from a small deliberate set (e.g. 4/8/12/16/24/32/48), not from every value currently in use.
- Keeping the fabricated InviteScreen friend data behind a flag "for now" — it must be removed or replaced with real data, not toggled.
- Redesigning the countdown/YearGrid concept itself — it scored well (#1 innovative, 2/3) and is explicitly in the Preserve list; only its execution details (contrast, states, token usage) are in scope.
- Extracting shared components with more configurability than the 6 existing call sites actually need — match the existing visual variants, don't invent new ones.
