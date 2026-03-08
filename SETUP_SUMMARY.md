# Propella App - API Error Handling & AI Integration Summary

## ✅ What Was Done

### 1. AI Engine Integration (LIVE Features)

The AI Engine at `https://ai-api.propella.ng` is now fully integrated and powers:

| Feature | Status | Implementation |
|---------|--------|----------------|
| Quiz Generation | ✅ Live | `src/api/quiz.api.ts` - Dynamic questions via `/quiz/generate` |
| Roadmap Generation | ✅ Live | `src/api/roadmap.api.ts` - Personalized study plans via `/roadmap/generate` |
| Tutor Chat | ✅ Live | `src/api/ai-engine.api.ts` - AI tutoring via `/tutor/chat` |
| Study Plans | ✅ Live | `src/api/ai-engine.api.ts` - Custom plans via `/study/plan` |
| Progress Tracking | ✅ Live | `src/api/ai-engine.api.ts` - Updates via `/progress/update` |

**Key Files:**
- `src/api/ai-engine.api.ts` - AI Engine client with all endpoints
- `src/api/quiz.api.ts` - AI-powered quiz with fallback questions
- `src/api/roadmap.api.ts` - AI-powered roadmap with local caching

### 2. API Error Handling & Fallbacks

#### Enhanced API Client (`src/api/client.ts`)
- ✅ Automatic token refresh on 401 errors
- ✅ Network error detection
- ✅ Auth failure handling with redirect to login
- ✅ Helper functions: `isAuthError()`, `isNetworkError()`, `getErrorMessage()`

#### New Hooks (`src/hooks/`)
- `useApi.ts` - Generic API hook with loading states, error handling, fallback support
- `usePerformance.ts` - Performance optimization hooks (debounce, throttle, intersection observer)

**Usage Example:**
```typescript
const { data, loading, error, isFallback, refetch } = useApi(
  () => dashboardApi.getDashboard(),
  {
    autoFetch: true,
    fallbackData: { nickname: "Guest", level: 1, points: 0 },
  }
);
```

### 3. Mock Service Worker (MSW) Setup

**Files Created:**
- `src/mocks/handlers.ts` - Mock handlers for all API endpoints
- `src/mocks/data.ts` - Centralized mock data
- `src/mocks/browser.ts` - MSW browser initialization
- `src/mocks/index.ts` - Export module
- `public/mockServiceWorker.js` - Service worker (placeholder)

**Mocked Endpoints:**
- Authentication (login, register, refresh)
- Dashboard data
- Subscription plans & payments
- Referrals & leaderboard
- Roadmap & tasks
- Quiz & diagnostic
- Streak tracking
- Tutor chat

**Usage:**
```bash
# MSW auto-enabled in development
# To force enable: http://localhost:5173/?msw=true
# To disable: localStorage.setItem('propella_use_real_api', 'true')
```

### 4. Error Boundaries (`src/components/ErrorBoundary.tsx`)

- `ErrorBoundary` - Global error catcher with reset functionality
- `ApiErrorBoundary` - Specialized for API errors with graceful degradation
- `withErrorBoundary()` - HOC for easy wrapping

**Usage:**
```tsx
<ErrorBoundary onError={logError}>
  <YourComponent />
</ErrorBoundary>
```

### 5. Performance Optimizations (`src/hooks/usePerformance.ts`)

Available hooks to fix "long handler" warnings:

| Hook | Purpose |
|------|---------|
| `useDebounce()` | Delay execution (for inputs) |
| `useThrottle()` | Limit execution rate (for scroll/resize) |
| `useOptimizedCallback()` | Uses requestAnimationFrame |
| `useScrollPosition()` | Optimized scroll tracking |
| `useIntersectionObserver()` | Lazy load components |
| `useVirtualList()` | Virtualize long lists |
| `useLayoutPaint()` | Defer heavy rendering |

**Example:**
```typescript
// Fix long click handler
const handleClick = useOptimizedCallback(() => {
  // Heavy computation
});
```

### 6. Updated Providers (`src/app/providers.tsx`)

- ✅ MSW initialization (development only)
- ✅ Global Error Boundary
- ✅ App initialization with error handling
- ✅ Auth failure event listener
- ✅ Suspense for lazy loading

## 🔧 How to Use

### Running the App

```bash
cd app
npm install  # (if MSW was installed)
npm run dev
```

### Switching Between Real API and Mocks

```javascript
// Use real API
localStorage.setItem('propella_use_real_api', 'true');
location.reload();

// Use mocks (default in dev)
localStorage.removeItem('propella_use_real_api');
location.reload();
```

### Debugging

```javascript
// Enable verbose logging
localStorage.setItem('propella_debug', 'true');

// Check current auth token
localStorage.getItem('propella_token');

// Force logout
localStorage.removeItem('propella_token');
location.reload();

// Clear roadmap cache
localStorage.removeItem('propella_roadmap_cache');
```

## 📁 File Structure Changes

```
src/
├── api/
│   ├── client.ts           # Enhanced with token refresh
│   ├── quiz.api.ts         # Now uses AI Engine
│   ├── roadmap.api.ts      # Now uses AI Engine
│   └── ai-engine.api.ts    # AI Engine integration
├── mocks/
│   ├── README.md           # Documentation
│   ├── handlers.ts         # MSW handlers
│   ├── data.ts             # Mock data
│   ├── browser.ts          # MSW setup
│   └── index.ts            # Exports
├── components/
│   └── ErrorBoundary.tsx   # Error handling
├── hooks/
│   ├── useApi.ts           # API hook with fallback
│   ├── usePerformance.ts   # Performance hooks
│   └── index.ts            # Updated exports
├── app/
│   └── providers.tsx       # Updated with MSW & ErrorBoundary
└── main.tsx                # Updated entry point

public/
└── mockServiceWorker.js     # MSW service worker
```

## 🎯 Backend API Status

| Endpoint | Backend Status | App Handling |
|----------|---------------|--------------|
| `/api/dashboard/` | 404 | ✅ Mock data via MSW |
| `/api/accounts/subscriptions/plans/` | 404 | ✅ Mock data via MSW |
| `/api/accounts/subscriptions/subscribe/` | 404 | ✅ Mock data via MSW |
| `/api/accounts/referrals/` | 401 | ✅ Mock data via MSW |
| `/quiz/generate` (AI) | ✅ Live | ✅ AI Engine |
| `/roadmap/generate` (AI) | ✅ Live | ✅ AI Engine |
| `/tutor/chat` (AI) | ✅ Live | ✅ AI Engine |

## 🚀 Features Working Now

1. **AI-Powered Quiz** - Generates unique questions for any subject/topic
2. **AI Roadmap Generation** - Personalized study plans
3. **AI Tutor Chat** - Real-time tutoring with multiple personalities
4. **Dashboard** - Mock data with fallback UI
5. **Subscriptions** - Mock plans with Flutterwave integration ready
6. **Referrals** - Mock stats and leaderboard
7. **Error Handling** - Graceful fallbacks throughout
8. **Performance** - Debounced/throttled handlers

## 📝 Notes

- The AI Engine is LIVE and requires the API key in `src/config/env.ts`
- Backend APIs returning 404/401 will automatically use mock data
- MSW only runs in development mode by default
- All API hooks have built-in error handling and fallback support
- Token refresh is automatic; 401 errors redirect to login
