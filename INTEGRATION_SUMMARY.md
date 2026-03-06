# PROPELLA API Integration Summary

## Overview
This integration connects the React.js/TSX frontend with the Django REST API backend for the PROPELLA learning app.

## Files Created

### 1. Configuration (`src/config/`)
- `env.ts` - Environment variables configuration
- `endpoints.ts` - Centralized API endpoint definitions
- `endpoints.txt` - API documentation for developers

### 2. API Layer (`src/api/`)
- `client.ts` - Axios HTTP client with interceptors
- `auth.api.ts` - Authentication API functions
- `dashboard.api.ts` - Dashboard data fetching
- `onboarding.api.ts` - Onboarding flow APIs
- `roadmap.api.ts` - Roadmap data APIs
- `quiz.api.ts` - Quiz operations APIs
- `tutor.api.ts` - AI tutor chat APIs
- `payment.api.ts` - Flutterwave payment APIs
- `learning.api.ts` - Weak topics and assignments APIs
- `settings.api.ts` - Profile and notification APIs
- `index.ts` - Centralized exports

### 3. State Management (`src/state/`)
- `user.store.ts` - Global user state (Zustand + persist)
- `app.store.ts` - Global app state (Zustand + persist)
- `index.ts` - Exports

### 4. Custom Hooks (`src/hooks/`)
- `useDashboard.ts` - Dashboard data with caching
- `useOnboarding.ts` - Onboarding flow management
- `useRoadmap.ts` - Roadmap data and task completion
- `useQuiz.ts` - Quiz fetching and submission
- `useTutor.ts` - AI tutor chat integration
- `useStreak.ts` - Streak tracking
- `usePayment.ts` - Payment processing
- `useSettings.ts` - Profile updates
- `useLearning.ts` - Weak topics and assignments
- `index.ts` - Centralized exports

### 5. Utilities (`src/utils/`)
- `greeting.ts` - Time-based greeting generation (Nigeria timezone)
- `time.ts` - Time utilities for Nigeria timezone
- `formatScore.ts` - Score formatting and level calculations
- `constants.ts` - App constants
- `index.ts` - Exports

### 6. Feature Components (`src/features/`)
- `settings/SettingsDropdown.tsx` - Settings dropdown with profile/notifications
- `payment/PaymentModal.tsx` - Payment flow modal

### 7. App Providers (`src/app/`)
- `providers.tsx` - App initialization and providers

## Modified Files

### 1. `src/main.tsx`
- Added Providers wrapper for app initialization

### 2. `src/sections/Dashboard.tsx`
- Integrated settings dropdown (replaced simple settings button)
- Added API data fetching with loading states
- Added payment modal integration
- Integrated global user state
- Added Nigeria timezone greeting

### 3. `src/sections/OnboardingFlow.tsx`
- Integrated API calls for exam profile and subjects
- Added diagnostic quiz API integration
- Added loading states and error handling
- Connected to global state stores

### 4. `src/sections/TutorPage.tsx`
- Integrated AI tutor API for chat
- Added message history persistence
- Connected to global tutor session state

### 5. `src/types/index.ts`
- Added API types re-export

### 6. `package.json`
- Added `axios` dependency

## Key Features Implemented

### 1. Global User State
```typescript
// Available across all pages
const { nickname, rank, level, points, streak } = useUserStore();
```

### 2. Global App State
```typescript
// Cached data to prevent repeated API calls
const { 
  todayRoadmap, 
  tutorSession, 
  weakTopics, 
  notifications,
  performanceGraph 
} = useAppStore();
```

### 3. API Hooks Pattern
```typescript
// All hooks follow consistent pattern
const { data, loading, error, refetch } = useDashboard();
const { sendMessage } = useTutor();
const { completeTask } = useRoadmap();
```

### 4. Settings Dropdown
- Profile Edit (nickname, AI tutor selection, voice toggle)
- Notifications list with unread count
- Logout functionality

### 5. Payment Integration
- Flutterwave payment flow
- Payment verification
- Access control based on payment status

## API Endpoints Connected

1. **Authentication** (already existed)
   - POST /auth/login/
   - POST /auth/signup/

2. **Dashboard**
   - GET /dashboard/
   - GET /performance-graph/
   - GET /user-level/

3. **Onboarding**
   - POST /exam-profile/
   - POST /user-subjects/
   - GET /diagnostic-quiz/
   - POST /quiz-results/

4. **Roadmap**
   - GET /roadmap/today/
   - POST /roadmap/tasks/{id}/complete/

5. **Streak**
   - GET /streak/
   - POST /update-streak/

6. **AI Tutor**
   - POST /ai-tutor/chat/

7. **Learning**
   - GET /weak-topics/
   - GET /assignments/
   - POST /assignments/{id}/complete/

8. **Payment**
   - POST /payments/initiate/
   - POST /payments/verify/

9. **Settings**
   - PUT /profile/update/
   - GET /notifications/

## Data Flow

1. **App Initialization**
   - `providers.tsx` fetches dashboard data
   - Populates `useUserStore` with user info
   - Sets authentication state

2. **Page Navigation**
   - Pages read from global state first
   - API hooks update global state after fetching
   - No repeated API calls when navigating back

3. **User Actions**
   - UI triggers hook functions
   - Hooks call API and update global state
   - UI re-renders with new data

## Environment Setup

```bash
# Install dependencies
cd app
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Authentication

Token is automatically attached to all requests via Axios interceptor:
```typescript
Authorization: Bearer <token from localStorage>
```

## Error Handling

- All API calls have try-catch blocks
- Errors are stored in hook state
- Toast notifications for user feedback
- Automatic redirect on 401 Unauthorized

## Caching Strategy

1. **User State** - Persisted to localStorage
2. **App State** - Selectively persisted
3. **API Hooks** - Return cached data if available
4. **Manual Refetch** - `refetch()` function available in all hooks

## Next Steps

1. Run `npm install` to install axios
2. Test API integration with backend
3. Verify payment flow with Flutterwave test credentials
4. Adjust API response mappings if backend format differs

## Notes

- Authentication endpoints were already implemented
- UI components were not modified except for integration points
- All new files follow the existing code style
- TypeScript types are complete for all API responses
- Settings button has been converted to a dropdown as requested
