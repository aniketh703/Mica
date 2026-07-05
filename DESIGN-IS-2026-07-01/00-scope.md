# Scope — Design Is Audit: Mica

**Date:** 2026-07-01
**Repo:** C:\Users\Ani\OneDrive\Desktop\MICA (branch: feat/phase1-play-store)

## What is being audited
Full app surface of Mica, a React Native / Expo "calm, personal calendar app." Static source audit (no running dev instance driven for this pass) — visual facts inferred from source (styles, theme tokens, StyleSheet objects) and marked INFERRED per the design-is subagent contract.

Screens in scope:
- `src/screens/onboarding/SplashScreen.tsx`
- `src/screens/onboarding/PitchScreen.tsx`
- `src/screens/onboarding/OnboardingScreen.tsx`
- `src/screens/onboarding/AuthChoiceScreen.tsx`
- `src/screens/MainScreen.tsx`
- `src/screens/HomeScreen.tsx`
- `src/screens/EventsScreen.tsx`
- `src/screens/EventDetailScreen.tsx`
- `src/screens/AddEventScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/screens/InviteScreen.tsx`
- Shared: `src/components/**`, `src/theme/**`

## Primary user
An individual managing their own personal calendar solo — not a team/collaboration tool first (though Invite exists). Primary task: view what's coming up, and create/edit an event quickly without friction.

## Constraints
- Stack: React Native (Expo), TypeScript
- No design system doc found yet at repo root — theme tokens live in `src/theme`
- Deadline: none stated
- Platform: mobile (iOS/Android), Play Store phase-1 branch in progress

## Reference designs / competitors
None supplied by user. Will not fabricate comparisons; #1 (innovative) and #7 (long-lasting) scored on internal evidence and general mobile-calendar-app conventions only.

## Out of scope for this pass
- Live device/simulator screenshots (no running instance driven)
- Backend/db correctness (separate concern from design)
- Android-specific native chrome
