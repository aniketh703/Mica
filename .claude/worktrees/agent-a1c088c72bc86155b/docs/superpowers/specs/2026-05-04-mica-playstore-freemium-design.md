# Mica — Play Store Freemium Design
**Date:** 2026-05-04
**Approach:** C — Feature-Flagged Freemium (local-first + Appwrite premium sync)
**Target:** Android (Google Play Store)

---

## 1. Summary

Mica is a privacy-first event countdown and year progress app. The goal is to ship a fully functional Android app to the Play Store using a freemium model:

- **Free tier:** all data stored locally via `expo-sqlite`, zero backend, full privacy
- **Premium tier:** cross-device sync via self-hosted Appwrite, unlocked via Google Play Billing one-time purchase
- **Feature flags:** `PremiumContext` backed by ConfigCat for remote toggling without releases
- **Build:** Expo EAS Build → `.aab` → Play Store

---

## 2. Tool Stack

| Tool | Role |
|---|---|
| `expo-sqlite` | Local event persistence (all users) |
| Appwrite (self-hosted) | Premium sync backend + Google OAuth2 |
| DigitalOcean ($6/mo Droplet) | Host Appwrite via Docker Compose |
| ConfigCat | Remote feature flags for `isPremium` |
| `react-native-iap` | Google Play Billing API wrapper |
| `expo-notifications` | Local scheduled reminders |
| `@react-native-community/datetimepicker` | Native Android DatePickerDialog |
| `@react-native-clipboard/clipboard` | Copy referral code |
| `@sentry/react-native` | Crash reporting + performance tracing |
| Doppler | Secrets management (never in git) |
| GitHub Actions | CI: type-check, test, lint, EAS preview build |
| Codecov | Test coverage reporting |
| GitHub Pages | Host privacy policy (required by Play Store) |
| Icons8 | App icon + event type icon assets |
| Imgbot | Auto-compress image assets in repo |
| Appfigures | Post-launch Play Store analytics |
| Name.com / Namecheap | Domain for Appwrite instance (e.g. api.mica.app) |

**Excluded intentionally:**
- Stripe (Play Store requires Google Play Billing for in-app digital purchases)
- Clerk (Appwrite Auth replaces it)
- Travis CI (GitHub Actions already in stack)
- Datadog / New Relic (Sentry covers mobile needs)

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Mica Android App                  │
│                                                     │
│  SQLite (expo-sqlite)  ←→  EventRepository          │
│         ↓ (premium only)                            │
│  Appwrite SDK  →  DigitalOcean Droplet              │
│                                                     │
│  PremiumContext  ←  ConfigCat (remote flag)         │
│  react-native-iap  →  Google Play Billing           │
│  expo-notifications  →  Android alarm scheduler     │
│  Sentry  →  crash reports                           │
└─────────────────────────────────────────────────────┘
         ↓ EAS Build
   Google Play Store (.aab)
         ↓
   GitHub Pages (privacy policy URL)
```

**Core principle:** every screen talks to `EventRepository`, which abstracts whether data comes from SQLite or Appwrite. Screens never know which backend is active — only `PremiumContext` knows.

---

## 4. Data Layer

### SQLite Schema

```sql
CREATE TABLE events (
  id           TEXT PRIMARY KEY,   -- uuid
  title        TEXT NOT NULL,
  date_iso     TEXT NOT NULL,       -- e.g. "2026-05-03"
  color        TEXT NOT NULL,
  type         TEXT NOT NULL,       -- Birthday/Deadline/Vacation/Milestone
  repeats      TEXT,                -- None/Yearly/Monthly
  reminder     TEXT,                -- None/1 day before/3 days before/1 week before
  note         TEXT,
  day_of_year  INTEGER,
  notification_ids TEXT,            -- JSON array of expo notification identifiers
  appwrite_id  TEXT,                -- null until synced
  deleted_at   TEXT,                -- soft-delete timestamp; NULL = active
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Known keys: 'theme', 'premium_status', 'notifications_enabled',
--             'last_sync_at', 'appwrite_user_id', 'premium_source'

CREATE TABLE migrations (
  version    INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
```

### EventRepository Interface

```typescript
interface IEventRepository {
  getAll(): Promise<MicaEvent[]>;
  getById(id: string): Promise<MicaEvent>;
  create(event: Omit<MicaEvent, 'id' | 'created_at' | 'updated_at'>): Promise<MicaEvent>;
  update(id: string, patch: Partial<MicaEvent>): Promise<MicaEvent>;
  delete(id: string): Promise<void>;
  sync(): Promise<void>; // no-op for free users
}
```

### Appwrite Schema

- One collection: `events` — mirrors SQLite schema
- Document-level security: each user reads/writes only their own documents
- Appwrite Auth: Google OAuth2 provider

### Sync Strategy

- **Conflict resolution:** last-write-wins on `updated_at`
- **Deletes:** soft-delete via `deleted_at` field so deletes propagate across devices
- **First sync:** all local SQLite events pushed to Appwrite on premium activation
- **Subsequent syncs:** fetch events updated after `last_sync_at`, merge into SQLite

### Sync Triggers

| Trigger | Action |
|---|---|
| Premium first activated | `authenticate()` → `initialSync()` |
| App comes to foreground | `pullChanges()` if last sync > 5 minutes ago |
| User creates/edits/deletes | `pushEvent()` / `deleteEvent()` immediately |
| Pull-to-refresh on EventsScreen | `pullChanges()` |

---

## 5. Feature Gating

### PremiumContext

```typescript
interface PremiumContextValue {
  isPremium: boolean;
  isLoading: boolean;
  premiumSource: 'iap' | 'configcat_override' | null;
  purchasePremium(): Promise<void>;
  restorePurchases(): Promise<void>;
}
```

**Resolution order on app start:**
1. Google Play Billing — verify active purchase via `react-native-iap`
2. ConfigCat — remote override (for support/testing)
3. SQLite settings cache — for offline startup

### ConfigCat

- Flag name: `isPremium`
- Evaluated per user by Appwrite user ID
- Use cases: gift premium to testers, % rollout, kill-switch for sync bugs
- SDK: `useFeatureFlag('isPremium', false)` — evaluates locally, no UI latency

### Free Tier Limits

| Feature | Free | Premium |
|---|---|---|
| Create / edit / delete events | ✅ | ✅ |
| Local notifications | ✅ | ✅ |
| Year grid & life calendar | ✅ | ✅ |
| Event count | Up to **12** | Unlimited |
| Cross-device sync (Appwrite) | ❌ | ✅ |
| Multiple reminders per event | ❌ | ✅ |
| Export events (CSV) | ❌ | ✅ |

Free tier limit enforced in `EventRepository.create()` — checks `COUNT(*)`, throws `PremiumRequiredError` if `count >= 12 && !isPremium`.

### Upgrade Flow

SettingsScreen → "Unlock Mica Premium" → bottom sheet modal:
- Live price fetched from Google Play via `react-native-iap`
- Feature list
- **Purchase** button → Play Billing flow → on success → `PremiumContext` updates → sync starts
- **Restore purchases** link (required by Play Store policy)

> **Phase 1 note:** Google Play Billing (`react-native-iap`) is a Phase 2 item. In Phase 1, the "Unlock Mica Premium" button opens a bottom sheet with a "Coming soon — join the waitlist" message. The 12-event free limit is still enforced so users understand the value proposition before Phase 2 ships.

---

## 6. Grid Quality

### YearGrid (365 cells — HomeScreen)

- **Layout:** 25 fixed columns × 15 rows (last 10 cells clipped via `dayOfYear <= 365` guard)
- **Cell size:** `(screenWidth - 44 - 24) / 25` — accounts for card padding and gaps
- **Gap:** 2px between cells
- **States:**
  - Past → `t.accent`, opacity 0.7
  - Today → `t.surface` + 1.5px `t.accentStrong` border + elevation glow
  - Future → `t.surfaceMuted`, opacity 0.4
  - Event day → cell uses event's `color` instead of default
- **Animation:** staggered row fade-in on mount (`Animated.stagger`, 8ms per row)
- **Performance:** `useMemo(() => buildCellData(yp, events), [yp.dayOfYear, events])`
- **Rehydration:** `AppState` change listener recalculates on foreground resume

### LifeCalendarGrid (52 × 7 — EventDetailScreen)

- **Layout:** week-major — column = week (0–51), row = day of week (0–6)
- **Cell size:** `(screenWidth - 44 - 16) / 52`
- **Cell shape:** perfect circle (`borderRadius: cellSize / 2`)
- **States (priority order):**
  1. Event day → `event.color` filled, scale 1.3
  2. Today → `t.surface` + 2px `t.accentStrong` border
  3. Countdown range → transparent + 1px `event.color` border, opacity 0.6
  4. Past → `t.accent`, opacity 0.5
  5. Future → `t.surfaceMuted`, opacity 0.3
- **Axis labels:** "W1", "W26", "W52" rendered below grid
- **Legend:** 4 items — Past / Today / Countdown / Event Day
- **Performance:** `useMemo(() => buildLifeCells(yp, event), [event.id, yp.dayOfYear])`

### New utilities in `yearProgress.ts`

```typescript
dateIsoToDayOfYear(iso: string): number
dayOfYearToDate(doy: number, year: number): Date
isCountdownRange(doy: number, today: number, eventDoy: number): boolean
buildCellData(yp: YearProgress, events: MicaEvent[]): CellState[]
buildLifeCells(yp: YearProgress, event: MicaEvent): LifeCellState[]
```

---

## 7. Screen Functionality

### HomeScreen
- Delete hardcoded `EVENTS` array
- Load events from `EventRepository.getAll()` via `useEvents()` custom hook
- "NEXT UP" = soonest event by `date_iso`
- `daysLeft` calculated live from `date_iso` vs today

### EventsScreen
- `useEvents()` hook for full list
- Filter chips query repository by type
- Empty state when no events exist
- `+` button → `AddEventScreen`

### AddEventScreen (most work)
- Date field → `@react-native-community/datetimepicker` (native Android DatePickerDialog)
- Repeats row → bottom sheet picker: None / Yearly / Monthly
- Reminder row → bottom sheet picker: None / 1 day before / 3 days before / 1 week before
- Note field → multiline `TextInput`
- Save → `EventRepository.create()` → schedule notification → navigate back
- Free limit guard: if `count >= 12 && !isPremium` → show upgrade sheet

### AddEventScreen reused as EditEventScreen
```typescript
// New optional param in RootStackParamList
AddEvent: { eventId?: string }
```
If `eventId` present: load event, pre-populate all fields, Save calls `EventRepository.update()`.

### EventDetailScreen
- Load live from `EventRepository.getById(id)` (not stale nav params)
- **Edit** → `AddEventScreen` with `eventId`
- **Delete** → `EventRepository.delete()` → cancel notification → `goBack()`

### SettingsScreen
- Theme buttons → write to SQLite settings, apply on restart
- Reminders toggle → `NotificationService.cancelAll()` / `rescheduleAll()`
- Unlock Premium → upgrade bottom sheet
- Privacy Policy → deep link to GitHub Pages URL
- Version → `expo-constants` from `app.json`
- Restore Purchases → `PremiumContext.restorePurchases()`

### InviteScreen
- Referral code: `ANIKETH-MICA-{year}` (no backend in v1)
- Copy → `@react-native-clipboard/clipboard`
- Share link → `Share.share()` (native Android share sheet)

---

## 8. Local Notifications

### `app.json` Android permissions
```json
"android": {
  "permissions": ["RECEIVE_BOOT_COMPLETED", "SCHEDULE_EXACT_ALARM"]
}
```

### NotificationService (`src/services/NotificationService.ts`)
```typescript
requestPermissions(): Promise<boolean>
scheduleReminder(event: MicaEvent): Promise<string>
cancelReminder(notificationId: string): Promise<void>
rescheduleAll(events: MicaEvent[]): Promise<void>
cancelAll(): Promise<void>
```

### Scheduling logic
```
"1 day before"  → 9:00 AM on (event date − 1 day)
"3 days before" → 9:00 AM on (event date − 3 days)
"1 week before" → 9:00 AM on (event date − 7 days)
"On the day"    → 9:00 AM on event date
```

- Past trigger dates → skip silently
- Yearly repeating events → schedule next 3 occurrences, store IDs as JSON in `notification_ids`

### Notification content
```
Title: "{event.title} in {n} days"
Body:  "{event.date} · {event.type}"
Data:  { eventId: string }   ← tap opens EventDetailScreen
```

### Deep link on tap
`App.tsx` — `addNotificationResponseReceivedListener` → extract `eventId` from data → `navigation.navigate('EventDetail', { eventId })`.

> **Nav param change:** `RootStackParamList` must be updated from `EventDetail: { event: MicaEvent }` to `EventDetail: { eventId: string }`. `EventDetailScreen` loads the live event from `EventRepository.getById(eventId)` on mount. This removes stale data bugs and enables notification deep links.

### Permission flow
Request on first event save with reminder set. If denied → inline banner, never block save.

---

## 9. Google Play Billing

### Product
```
Product ID:  com.mica.premium
Type:        One-time purchase (inapp)
```

### Purchase flow
```
1. PremiumContext.purchasePremium()
2. requestPurchase({ skus: ['com.mica.premium'] })
3. Native Google Play sheet (no custom UI)
4. purchaseUpdatedListener success:
   - finishTransaction() (required)
   - Write premium_status to SQLite settings
   - Update ConfigCat user attribute
   - isPremium = true
   - Start initialSync()
5. Error → toast + Sentry log
```

### Restore purchases
`getAvailablePurchases()` → if `com.mica.premium` found → same as step 4. Required button in SettingsScreen.

---

## 10. Infrastructure & DevOps

### GitHub Actions

**On every push:**
- `tsc --noEmit --skipLibCheck` (type-check)
- `jest --coverage` → upload to Codecov
- `eslint src/**/*.{ts,tsx}`

**On merge to main:**
- `eas build --platform android --profile preview` → posts `.apk` download link on PR

### Sentry setup in `App.tsx`
```typescript
Sentry.init({ dsn: process.env.SENTRY_DSN });
// On premium activate:
Sentry.setUser({ id: appwriteUserId });
// On free tier:
Sentry.setUser(null); // anonymous
```

### Doppler secrets
```
APPWRITE_ENDPOINT
APPWRITE_PROJECT_ID
CONFIGCAT_SDK_KEY
SENTRY_DSN
SENTRY_AUTH_TOKEN
```
Injected into EAS builds via `eas.json` `env` block. Local dev: `doppler run -- expo start`.

### EAS profiles (`eas.json`)
```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": { "android": { "buildType": "app-bundle" } }
  }
}
```

### DigitalOcean Appwrite
- $6/mo Basic Droplet (1GB RAM, 25GB SSD), Ubuntu
- Appwrite installed via Docker Compose (one-command install)
- Domain (Name.com / Namecheap) → e.g. `api.mica.app`
- SSL via Appwrite's built-in Let's Encrypt

### GitHub Pages — Privacy Policy
- `docs/privacy-policy.md` in repo
- Served at `https://{username}.github.io/mica/privacy-policy`
- Covers: local-only free tier, Appwrite sync for premium, Sentry anonymised crash logs, account deletion contact

---

## 11. Play Store Release

### `app.json` Android config
```json
{
  "expo": {
    "name": "Mica",
    "slug": "mica",
    "version": "1.0.0",
    "android": {
      "package": "com.mica.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon-foreground.png",
        "backgroundColor": "#F5F1EA"
      },
      "permissions": ["RECEIVE_BOOT_COMPLETED", "SCHEDULE_EXACT_ALARM"]
    },
    "plugins": [
      "expo-notifications",
      "@react-native-community/datetimepicker",
      "expo-sqlite"
    ]
  }
}
```

### Store listing
| Field | Value |
|---|---|
| Short description | "Track what matters. Your year, your events, your privacy." |
| Privacy policy URL | GitHub Pages URL |
| Content rating | Everyone (IARC questionnaire) |
| Target API level | API 35 (Android 15) |

### Data Safety form
| Data | Collected? | Notes |
|---|---|---|
| Email | Yes (premium only) | Appwrite OAuth2 |
| App activity (events) | Yes (premium only) | User's own Appwrite instance |
| Crash logs | Yes | Sentry, anonymised on free tier |
| Name / device IDs | No | |

### Release track strategy
1. **Internal Testing** → up to 100 testers, test billing with Google test accounts
2. **Closed Testing (Beta)** → gather feedback, fix Sentry crashes
3. **Production** → staged rollout: 10% → 50% → 100% over 2 weeks

---

## 12. Phase Plan

### Phase 1 — Ship to Play Store (weeks 1–3)
- SQLite persistence + EventRepository
- Real CRUD on all screens
- `@react-native-community/datetimepicker`
- Grid polish (YearGrid + LifeCalendarGrid)
- Local notifications
- PremiumContext with free limit (12 events)
- GitHub Actions CI
- Sentry integration
- Doppler secrets setup
- GitHub Pages privacy policy
- App icon + splash screen (Icons8)
- EAS production build → Play Store Internal Testing → Production

### Phase 2 — Premium (weeks 4–6)
- Google Play Billing (`react-native-iap`)
- Appwrite on DigitalOcean
- SyncService (initial sync + incremental sync)
- Google Sign-In via Appwrite OAuth2
- ConfigCat feature flags
- Upgrade bottom sheet UI
- Restore purchases flow
- Export events (CSV)
- Multiple reminders per event
- Play Store update submission
