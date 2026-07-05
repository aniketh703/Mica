# Scorecard — Design Is Audit: Mica

1. Good design is innovative — Score: 2/3
   Evidence: The countdown-centric "year made visible" framing (YearGrid, LifeCalendarGrid, day-count-first Home screen) is a genuine POV departure from grid-first calendar apps — see 01-evidence.md Structural + PitchScreen copy ("The year, made visible").
   Justification: Refreshes an existing pattern (personal countdown apps exist) with a considered, coherent improvement — not a wholly novel pattern across 5+ peers, but clearly more than imitation; the rest of the app (onboarding flow, chip pickers, theme switcher) is conventional mobile UI.

2. Good design is useful — Score: 2/3
   Evidence: Core create/view loop (Home → AddEvent, Home → EventDetail) is short and direct, but 8 interactive elements app-wide are decoys — 6 "Coming soon" alerts (AuthChoiceScreen ×3, SettingsScreen ×3) plus 2 fully dead buttons (InviteScreen Message/More, Add from contacts) that look functional but do nothing.
   Justification: Primary task itself isn't blocked, but adjacent surfaces (auth, settings, invite) add non-functional detours that a user cannot distinguish from real ones until tapped — matches "primary task completes but adjacent surface adds steps," not the decoy-free top score.

3. Good design is aesthetic — Score: 1/3
   Evidence: No spacing or typography token module exists anywhere in `src/theme/` — 26 ad-hoc spacing values and 18 ad-hoc fontSize values found inline; the "same" card concept uses 3 divergent border-radii (20/24/28); 16 hardcoded hex colors sit outside the 26-token palette system, 10 of them re-typed duplicates of existing tokens.
   Justification: Far more than "3-5 inconsistencies" by raw count, but a real, consistently-applied visual motif (warm palette, bloom decoration, card language) is visibly present and prevents "no system/active noise" — sits just above the floor.

4. Good design is understandable — Score: 1/3
   Evidence: Copy is largely plain-language (no jargon flagged as seriously confusing besides "Daily nudge" ambiguity and a COLOUR/COLOR spelling inconsistency), but 2 controls (InviteScreen Message/More share buttons, Add from contacts) render as tappable with zero handler — a first-time user cannot tell these don't work until they try.
   Justification: Dead-but-styled-as-live controls are worse than unclear labeling — they actively mislead about what tapping will do, which is a stronger failure than "needs a tooltip"; combined with the minor label inconsistency this exceeds the single-control threshold for the top two scores.

5. Good design is unobtrusive — Score: 2/3
   Evidence: The countdown numbers and event content are visually dominant (fontSize up to 64px); decorative "bloom" circles are subtle (blur/opacity) but recur 15+ times across nearly every screen with zero functional purpose.
   Justification: Chrome stays quiet and never competes with content, but a purely decorative element repeated on almost every screen is "chrome visible" rather than fully receded — keeps this from the top score.

6. Good design is honest — Score: 0/3
   Evidence: InviteScreen renders hardcoded fake "invited friends" (Jamie R./Priya K./Tom L.) unconditionally as real user data (01-evidence.md Copy & Honesty), and promises a referral reward ("free for 30 days," "unlock a premium month") that no billing system exists to fulfill (`PremiumContext.tsx:23` hardcodes `isPremium = false`, explicitly deferred to "Phase 2").
   Justification: Fabricated social proof plus an unfulfillable reward promise is a deceptive flow, not a mere inflation — this is the anchor's explicit 0 case, and it sits on a load-bearing principle.

7. Good design is long-lasting — Score: 3/3
   Evidence: No dated trend markers found anywhere in the evidence — no gradients, no skeuomorphism, no trend-driven typography (default system font used throughout, no custom face); warm-neutral calm palette and restrained copy read as timeless rather than of-the-moment.
   Justification: Nothing in the visual or structural evidence points to a specific-year aesthetic; the calm/minimal direction has been stable for years and shows no fad markers.

8. Good design is thorough down to the last detail — Score: 1/3
   Evidence: Error state is only a native `Alert.alert` with no in-UI error component anywhere (01-evidence.md Visual); success state has no persistent confirmation UI (only an ephemeral "Copied!" label swap); focus styling exists on only 1 of 4 TextInput instances app-wide.
   Justification: Three states (error, success, focus) are missing or rough app-wide, which lands in the "2-3 states missing" band, not the single-gap band.

9. Good design is environmentally friendly — Score: 2/3
   Evidence: Zero network calls (fully local SQLite), no idle-looping animation on the primary Home/Main screen, dark mode honored via `useColorScheme`, `useReducedMotion` respected in Splash/Pitch/AddEvent — but a hard-coded 1.5s minimum splash delay and 2-3 redundant parallel `getAll()` DB queries on every cold start burn time/battery for no functional reason.
   Justification: Core signals (motion gating, dark mode, no idle animation, no network) are strong, but the artificial delay and redundant queries are real, avoidable waste that keep this off the top score; bundle size <100KB cannot be confirmed for a native RN/Expo app either way.

10. Good design is as little design as possible — Score: 1/3
    Evidence: The same feature is built twice with divergent UI (theme picker: OnboardingScreen swatch-cards vs SettingsScreen segmented buttons); the same interaction concept is implemented independently 6× with no shared component (list-row pattern) and 3× (empty-state card); a full block of dead, unreferenced styles sits in `EventsScreen.tsx:399-415`.
    Justification: This is well beyond "3-5 removable elements" in raw instance count across the app, though no single screen feels decoration-dominated — systemic duplication rather than visual bloat keeps this out of the 0 floor but well below "≤2 removable."

**Total: 15/30**
