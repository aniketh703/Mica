# MICA

Make time visible.

MICA is a privacy-first Expo + React Native app for Android that turns the current year and upcoming life events into calm, always-visible time visuals. This repository currently contains the v1 architecture and a TypeScript app shell aligned with the product brief.

## Product Shape

- Minimal year-progress experience centered on a 365/366-day grid
- Event countdowns for birthdays, anniversaries, deadlines, vacations, and custom milestones
- Native Android widgets for year progress and countdown visibility
- Smart local reminders using Android scheduling APIs
- One-time premium unlock with no accounts and no cloud dependency

## Current Structure

- `src/navigation`: app navigation and tab structure
- `src/screens`: primary product surfaces
- `src/components`: reusable UI and time-visual components
- `src/store`: local app state for events, preferences, and premium status
- `src/lib`: date logic and formatting helpers
- `src/native`: TypeScript-facing native integration contracts
- `docs`: architecture and implementation planning

## Expo Runtime Notes

- The current year-progress experience is Expo Go compatible.
- Android widgets, billing, and custom native notification modules are not available in Expo Go.
- For those features, move to an Expo development build with `npx expo prebuild` and native modules/config plugins.

## Planned Native Android Modules

- Widgets via Kotlin App Widgets
- Notifications via `NotificationManager`
- Background refresh via `WorkManager`
- Local persistence via Expo-friendly storage in v1, Room bridge later if needed
- Billing via Google Play Billing and `react-native-iap`

## Recommended Build Order

1. Finalize the React Native base project and install dependencies.
2. Implement event persistence and editing flows.
3. Build Android widget native module and refresh pipeline.
4. Add notifications and premium purchase flow.
5. Harden accessibility, testing, and release configuration.

## Getting Started

This repo is set up for Expo-based development. If you want native Android/iOS directories later, generate them with `npx expo prebuild`.

If you want, the next step can be either:

1. scaffold the full React Native project files for Android, or
2. keep building product logic and UI first inside this source structure.
