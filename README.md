# MICA

MICA is a privacy-first Expo and React Native app that makes time visible. It turns the current year and important life events into calm, glanceable progress views for mobile and, eventually, Android widgets.

## Features

- Year progress dashboard with a 365/366-day visual grid.
- Event countdowns for birthdays, anniversaries, deadlines, vacations, and custom milestones.
- Local-first state management for events, preferences, and premium status.
- Expo-compatible TypeScript app shell with navigation, themed screens, and reusable UI components.
- Planned native Android integrations for widgets, notifications, background refresh, and billing.

## Tech Stack

- Expo 55
- React 19
- React Native 0.83
- TypeScript
- React Navigation
- Zustand
- Jest

## Getting Started

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run on web:

```bash
npm run web
```

## Scripts

- `npm start`: start the Expo development server.
- `npm run android`: open the app in an Android target.
- `npm run ios`: open the app in an iOS target.
- `npm run web`: open the app in a web target.
- `npm run prebuild`: generate native Android and iOS project folders.
- `npm run lint`: run ESLint.
- `npm run typecheck`: run TypeScript without emitting files.
- `npm test`: run Jest tests.

## Project Structure

```text
.
├── App.tsx
├── docs/
│   └── architecture.md
├── src/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── native/
│   ├── navigation/
│   ├── screens/
│   ├── store/
│   ├── theme/
│   └── types/
└── package.json
```

## Expo Runtime Notes

The current app shell and year-progress experience are Expo Go compatible. Native Android widgets, billing, and custom notification modules require an Expo development build generated with `npm run prebuild`.

## Product Direction

MICA is designed around a few constraints:

- Keep personal event data on the device.
- Prefer calm, low-noise visuals over heavy analytics.
- Share date math and presentation logic in TypeScript.
- Use native Android only where it materially improves the product, such as widgets and scheduled reminders.

See [docs/architecture.md](docs/architecture.md) for the architecture plan.
