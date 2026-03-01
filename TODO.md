# PROPELLA Onboarding Fix - TODO

## Task:

1. Retain dashboard after refresh ✅
2. Setting button on dashboard that takes you back to onboarding session ✅

## Completed Changes:

### 1. app/src/App.tsx

- **Removed** the `useEffect` that called `resetApp()` on every fresh start
- The store already uses `zustand` with `persist` middleware, so data now persists to localStorage automatically
- This fixes the issue where dashboard data was lost after refresh

### 2. app/src/sections/Dashboard.tsx

- **Already has** the Settings button that calls `resumeOnboarding()`
- Located in the header section with a gear icon
- Clicking it takes users back to the onboarding session

## How it works:

- When user completes onboarding, `isOnboardingComplete` is set to `true` in the store
- On refresh, the persisted state is restored and the dashboard shows
- The Settings button (gear icon) in the dashboard header calls `resumeOnboarding()` which sets `isOnboardingComplete` to `false`, navigating back to onboarding
