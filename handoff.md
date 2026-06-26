# Mica — Phase 1 Handoff

## Goal

Ship the **Phase 1 (local-first, freemium)** version of **Mica** to the Google Play Store internal track.

Mica is a calm, personal calendar app built in React Native (Expo SDK 55). It visualises the user's year as a grid, counts down to events, and sends local notifications. Phase 1 is fully offline — no backend, no sync — monetised later via a premium gate (ConfigCat + billing in Phase 2).

Target distribution: **Android APK → Play Store internal track** via EAS Build.

---

## Current State

| Area | Status |
|---|---|
| TypeScript | ✅ 0 errors (`npx tsc --noEmit`) |
| Tests | ✅ 62 passing (2 suites) |
| Branch | `feat/phase1-play-store` pushed to `https://github.com/aniketh703/Mica.git` |
| Latest commit | `29a45b1` — fix(splash): route returning users to Main, new users to Pitch |
| Unstaged changes | `app.json` + `src/services/NotificationService.ts` (see Files in Flight) |
| Build | Not yet run — EAS project ID is a placeholder |

### What works end-to-end

- Full onboarding flow: Splash → Pitch → AuthChoice → Onboarding (5 steps) → Main
- Splash now reads `settings.onboardingComplete` from SQLite and routes returning users directly to Main
- Home screen renders YearGrid with real event markers; empty state; next-event card; "more coming up" list
- Events screen with filter chips (All / Soon / Birthday / Work / Travel)
- Add / Edit Event: title, type, date picker, repeats, reminder, colour swatches, note
- Event Detail: days-until countdown, LifeCalendarGrid slice, delete with confirm, edit
- Settings: theme toggle (system / light / dark), notification toggle, premium gate counter
- Notifications: schedule/cancel per-event, Android channel, Expo Go guard
- SQLite via `expo-sqlite` with full migration + EventRepository (CRUD + settings key/value store)
- ThemeProvider + `useTheme()` — no prop-drilled `t: Theme` anywhere
- PremiumContext (Phase 1 free limit = 12 events)
- GitHub Actions CI: type-check → lint → test → Codecov

---

## Files in Flight

These files have **local changes that are not yet committed**:

### `app.json` (unstaged — 1 line removed)
```diff
-      "googleServicesFile": "./google-services.json",
```
`google-services.json` does not exist in the repo. The line was added speculatively for Firebase push notifications that are not part of Phase 1. Remove it before running `expo prebuild` or it will crash the Gradle build.

**Action:** `git add app.json && git commit -m "chore: remove missing googleServicesFile ref from app.json"`

---

### `src/services/NotificationService.ts` (unstaged — large rewrite)
The committed version calls `expo-notifications` at module-load time, which throws in **Expo Go** (the dev client used during local development). The unstaged version wraps all notification calls in an `isNotificationsSupported()` guard and lazy-loads `expo-notifications` via dynamic `import()` so the module never initialises in Expo Go.

This change is needed to run the app with `npx expo start` during development. It does not affect the EAS build.

**Action:** Review the diff, then `git add src/services/NotificationService.ts && git commit`.

---

## Things That Have Changed

All changes are on branch `feat/phase1-play-store`. Full commit log:

```
29a45b1  fix(splash): route returning users to Main, new users to Pitch
b8e4241  chore: placeholder assets, CI workflow, jest config fixes
9650653  feat(build): Android app.json + EAS build profiles
5126a94  feat(screens): wire all screens to real data, full nav + SQLiteProvider
dfa1bb5  feat(screens): add OnboardingScreen (5-step flow)
e145c5c  feat(screens): add Splash, Pitch, AuthChoice onboarding screens
392d361  feat(components): YearGrid + LifeCalendarGrid with real event data
af78280  feat(services): add NotificationService for expo-notifications
2ee104b  feat(hooks): add useEvents, useSettings, useEventRepository, PremiumContext
73f2150  feat: theme context, grid utilities, extended nav types
3b672b8  feat(db): add SQLite migration + EventRepository with CRUD tests
e4c15d0  feat(db): add SQLite schema migration
2b1c6aa  refactor(types): use union types on MicaEvent fields, discriminated CellData
35791f5  feat(types): update MicaEvent to uuid+dateIso, fix EventDetail nav param
f3320288 chore: pin community package versions with tilde (native compat)
```

### Key structural decisions made during this session

- **`useTheme()`** replaces prop-drilled `t: Theme` on all screens. Only `TabBar` still receives `t` as a prop (passed down from `MainScreen`).
- **`EventRepository.update()`** does not accept `dayOfYear` — it is always recomputed from `dateIso` internally. Any call to `update()` that tries to pass `dayOfYear` will be a TypeScript error.
- **`repo.create()`** takes `dayOfYear: 0`; the repository recomputes the real value before inserting.
- **`useSQLiteContext()`** is used directly in SplashScreen (not via `useEventRepository`) because the splash needs one fast scalar read before the full hook tree is ready.
- Design tokens (`mica` light palette + `midnight` dark palette) live in `src/theme/palette.ts` and were extracted verbatim from Claude Design files (gzip-compressed HTML). Do not hand-edit these values.

---

## Failed Attempts

### 1. Git worktree isolation (subagent parallelism)
**What happened:** The previous session created several `git worktree` branches under `.claude/worktrees/`. After the session context ran out, those worktrees were left in a locked state. New agents in this session could not create new worktrees (`EEXIST` / `Permission denied`). `git worktree remove --force` also failed with a permissions error.

**Resolution:** Abandoned worktree isolation entirely for this session. All writes done directly in the main working tree using `Write` / `Edit` tools.

**Side effect still present:** `.claude/worktrees/agent-a11faf95246b23b5c/package.json` still exists on disk and causes a Jest **Haste module naming collision** warning (`date-utils-tests` appears in both `package.json` files). Tests still pass, but the warning is noisy. Fix: manually delete `.claude/worktrees/` or add it to `.gitignore` and Jest `testPathIgnorePatterns` (already done for the pattern, but the directory persists).

### 2. `expo-notifications` crashing in Expo Go
**What happened:** The initial `NotificationService.ts` called `Notifications.setNotificationHandler()` at module load time. Expo Go does not support custom notification handlers and throws immediately on import.

**Resolution:** Unstaged rewrite (see Files in Flight above) wraps the entire module in a lazy-load + `isNotificationsSupported()` guard using `expo-constants` to detect Expo Go vs standalone.

### 3. `package.json` `name` field is wrong
The package name is `"date-utils-tests"` — a leftover from an early scaffold. This is the root cause of the Haste collision warning and could cause confusion if the package is ever published or referenced. It should be `"mica"`.

**Not yet fixed.** Change `"name": "date-utils-tests"` → `"name": "mica"` in `package.json`.

### 4. `googleServicesFile` in app.json
Added speculatively for Firebase. The file `google-services.json` does not exist. EAS Build / `expo prebuild` will fail if this line remains. See Files in Flight above.

### 5. Design file format
The Claude Design files provided were gzip-compressed binary files. `WebFetch` cannot decode them. Resolution: decompressed locally with Node.js `zlib.gunzipSync()` and read the resulting HTML to extract design tokens.

---

## Next Steps

### Must-do before Play Store submission

1. **Commit the two unstaged files**
   ```bash
   git add app.json src/services/NotificationService.ts
   git commit -m "fix: remove googleServicesFile ref; guard notifications for Expo Go"
   ```

2. **Fix `package.json` name**
   Change `"name": "date-utils-tests"` to `"name": "mica"`. This fixes the Jest Haste collision warning and removes the misleading package identity.
   ```bash
   # Edit package.json, then:
   git add package.json && git commit -m "chore: rename package to mica"
   ```

3. **Replace placeholder assets**
   The files in `assets/` are 1×1 pixel transparent PNGs created as stubs.
   - `assets/icon.png` — 1024×1024, no transparency, safe zone: inner 768×768
   - `assets/adaptive-icon.png` — 1024×1024 foreground only, transparent bg, safe zone: inner 66% (673px)
   - `assets/splash-icon.png` — any size; will be `contain`-fitted on `#F5F1EA` background
   - `assets/notification-icon.png` — 96×96 white-on-transparent monochrome

4. **Register with EAS**
   ```bash
   eas login          # authenticate as aniketh703
   eas build:configure
   ```
   Then replace `"YOUR_EAS_PROJECT_ID"` in `app.json → expo.extra.eas.projectId` with the real UUID returned by `eas build:configure`.

5. **Verify Gradle build with prebuild**
   ```bash
   npx expo prebuild --platform android --clean
   ```
   This generates `android/` from `app.json`. Fix any errors here before triggering EAS.

6. **Trigger EAS preview build**
   ```bash
   eas build --platform android --profile preview
   ```
   Produces a signed APK for internal distribution. Download and sideload to verify on a real device.

7. **Merge to `main` and tag**
   Once the preview build passes smoke testing, open a PR from `feat/phase1-play-store` → `main`, merge, and tag `v1.0.0`.

8. **Submit to Play Store**
   - Build production AAB: `eas build --platform android --profile production`
   - Place `google-play-key.json` service account key at repo root (gitignored)
   - Submit: `eas submit --platform android`

### Nice-to-have before submission

- **SplashScreen animation cleanup:** The rotation `Animated.loop` is not stopped when the component unmounts. Add a `useRef` for the animation and call `.stop()` in the cleanup return of the `useEffect`.
- **Stale worktree cleanup:** `rmdir /s /q .claude\worktrees` (Windows) to remove the locked stale worktrees and silence the Jest collision warning.
- **Add `Invite` screen real share intent:** Currently shows a static UI. Wire `Share.share()` from `react-native` to the referral copy.
- **`expo-font` usage:** `expo-font` is in the plugins list in `app.json` but no custom fonts are loaded yet. Either load fonts in `App.tsx` or remove the plugin.

---

## Key File Map

```
MICA/
├── App.tsx                          # Root: SQLiteProvider > ThemeProvider > NavigationContainer
├── app.json                         # Expo config, Android permissions, plugins  ⚠️ unstaged change
├── eas.json                         # EAS Build profiles (development/preview/production)
├── jest.config.js                   # Jest + coverage thresholds
├── .github/workflows/ci.yml         # GitHub Actions CI
├── assets/                          # ⚠️ all placeholder stubs — replace before build
├── src/
│   ├── types/index.ts               # MicaEvent, RootStackParamList, union types
│   ├── theme/
│   │   ├── palette.ts               # mica (light) + midnight (dark) design tokens
│   │   └── ThemeContext.tsx         # ThemeProvider, useTheme(), useThemeMode()
│   ├── db/
│   │   ├── database.ts              # migrateDatabase() — SQLite schema + migrations
│   │   └── EventRepository.ts       # CRUD + settings key/value store
│   ├── hooks/
│   │   ├── useEventRepository.ts    # Returns memoised EventRepository from SQLiteContext
│   │   ├── useEvents.ts             # events[], loading, createEvent, updateEvent, deleteEvent
│   │   └── useSettings.ts           # themeMode, userName, interests, notifications, onboardingComplete
│   ├── context/
│   │   └── PremiumContext.tsx       # isPremium, eventCount, canAddEvent (FREE_EVENT_LIMIT=12)
│   ├── services/
│   │   └── NotificationService.ts   # schedule/cancel notifications  ⚠️ unstaged Expo Go guard
│   ├── utils/
│   │   └── yearProgress.ts          # dateIsoToDisplay, daysUntilIso, buildCellData, buildLifeCells, buildEventDaysMap
│   ├── components/
│   │   ├── YearGrid.tsx             # 365-cell grid with event markers
│   │   ├── LifeCalendarGrid.tsx     # 52-week life calendar, column-major
│   │   └── TabBar.tsx               # Bottom tab bar (Home / Events / Settings)
│   └── screens/
│       ├── onboarding/
│       │   ├── SplashScreen.tsx     # Reads onboardingComplete from SQLite, routes accordingly
│       │   ├── PitchScreen.tsx      # 3-pane paginated intro
│       │   ├── AuthChoiceScreen.tsx # "Use privately" vs social login (social = coming soon)
│       │   └── OnboardingScreen.tsx # 5-step setup: name / interests / theme / notifications / first event
│       ├── MainScreen.tsx           # Tab navigator host; wraps in PremiumProvider
│       ├── HomeScreen.tsx           # YearGrid + next event card + upcoming list
│       ├── EventsScreen.tsx         # Filtered event list
│       ├── AddEventScreen.tsx       # Create / edit form
│       ├── EventDetailScreen.tsx    # Full event detail + LifeCalendarGrid
│       ├── SettingsScreen.tsx       # Theme / notifications / premium tier / about
│       └── InviteScreen.tsx         # Referral share sheet (static for now)
```
