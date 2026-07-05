# Verdict — Design Is Audit: Mica

**Total: 15/30. Verdict: REDESIGN.**

Mica's total score falls well below the 20-point REFINE threshold, and principle #6 (honest) scored 0 on a load-bearing dimension — the app fabricates social proof (fake "invited friends" on InviteScreen) and promises a referral reward with no backend to fulfill it — which alone mandates REDESIGN under the verdict rule, independent of the total.

## Top 5 highest-leverage moves

1. **#6 Honest** — Remove the hardcoded fake `FRIENDS` array (`InviteScreen.tsx:18-22`) that renders fabricated invite history as if real, and either build the referral-reward backend or strip the unfulfillable "free for 30 days / unlock a premium month" promise (`InviteScreen.tsx:114-116`) until `PremiumContext.tsx:23`'s billing integration actually exists. Evidence: `InviteScreen.tsx:18-22`, `:114-116`, `:176-177`; `PremiumContext.tsx:23`.

2. **#4 Understandable / #10 As little design as possible** — Wire up or delete the two fully dead buttons that look tappable but have no handler: "Message"/"More" share buttons (`InviteScreen.tsx:124`) and "Add from contacts" (`InviteScreen.tsx:166-171`). Evidence: `InviteScreen.tsx:24-28,124,166-171`.

3. **#3 Aesthetic** — Introduce real `spacing.ts` and `typography.ts` token modules to replace the 26 ad-hoc spacing values and 18 ad-hoc fontSize values found inline across screens, and collapse the 3 divergent card border-radii (20/24/28) into one. Also route the 16 hardcoded hex colors (10 of which duplicate existing tokens) through `palette.ts` instead of re-typing values. Evidence: 01-evidence.md Visual — no token module exists in `src/theme/` beyond `palette.ts`.

4. **#8 Thorough** — Build a real in-UI error state (replace the bare `Alert.alert('Error', ...)` at `AddEventScreen.tsx:246-249`) and a persistent success confirmation pattern, and extend focus styling from the one `TextInput` that has it (`OnboardingScreen.tsx:246-259`) to the other three that don't (`AddEventScreen.tsx:287-295`, `:408-416`; `OnboardingScreen.tsx:486-493`). Also fix the theme-aware text-on-fill contrast bug: hardcoded `#FFF7EC` label color against `midnight.accentStrong` (`#F0CF9A`) resolves to 1.40:1 in dark mode — replace with the existing `t.onAccent` token. Evidence: 01-evidence.md Visual.

5. **#10 As little design as possible** — Extract the theme-picker (duplicated at `OnboardingScreen.tsx:353-390` vs `SettingsScreen.tsx:115-138`), the color-swatch picker (duplicated at `OnboardingScreen.tsx:513-524` vs `AddEventScreen.tsx` `ColorSwatch:84-96`), and the list-row pattern (independently implemented 6× across Home/Events/CalendarView/EventDetail/Settings/Invite) into shared components. Delete the dead style block at `EventsScreen.tsx:399-415`. Evidence: 01-evidence.md Structural.

## What to preserve

- The color-token system itself (26 tokens across `mica`/`midnight` palettes in `palette.ts`) — the honesty and consistency problems are about values escaping the system, not the system being wrong.
- The countdown-centric visual concept (YearGrid, LifeCalendarGrid, day-count-first Home) — this is the app's one genuinely innovative differentiator (#1 scored 2/3, the second-highest score).
- The restrained, non-inflated copy voice — zero marketing-superlative violations found across all 11 screens.
- The fully local, no-network architecture (`expo-sqlite` only) — strong foundation for both honesty and environmental cost once the fabricated-data problem on InviteScreen is fixed.
