# MICA Architecture

## Principles

- Privacy first: all user data remains on-device
- Calm by default: low-noise UI with high emotional clarity
- Native where it matters: widgets, billing, notifications, background work
- Shared logic where possible: date math and presentation in TypeScript

## Layers

### React Native Layer

- App shell and navigation
- Year grid visualization
- Event CRUD flows
- Theme and premium gating
- Native module orchestration

### Android Native Layer

- App widgets
- Scheduled notification delivery
- Background daily refresh
- Billing and restore purchases
- Optional Room-backed persistence for widgets and background workers

## Data Model

### Event

- `id`
- `title`
- `date`
- `category`
- `color`
- `reminderDaysBefore`
- `notes`

### Preferences

- `themeMode`
- `themePreset`
- `yearGridAccent`
- `todayHighlightStyle`
- `widgetStyle`

### Premium

- `isPremium`
- `purchaseSource`
- `purchasedAt`

## v1 Decisions

- Use Zustand with MMKV persistence for app state speed and simplicity
- Keep event and year calculations in shared TypeScript utilities
- Define native interfaces early so widget and notification work can slot in cleanly
- Support Android first while keeping the JS architecture portable to iOS

## Native Bridge Surface

- `MicaWidgetsModule.refreshWidgets()`
- `MicaNotificationsModule.scheduleEventReminder(event)`
- `MicaNotificationsModule.cancelEventReminder(eventId)`
- `MicaBillingModule.purchasePremium()`
- `MicaBillingModule.restorePurchases()`
