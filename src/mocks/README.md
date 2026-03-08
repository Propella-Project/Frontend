# API Mocking & Error Handling

This document explains how the Propella app handles API failures, uses the AI Engine for live features, and provides fallback data.

## Overview

The app is designed to work even when the backend API is unavailable or partially implemented. It uses a multi-layered approach:

1. **AI Engine** - Live AI-powered features (quiz generation, roadmap generation, tutor chat)
2. **Backend API** - Primary data source when available
3. **Mock Service Worker (MSW)** - Intercepts API calls in development
4. **Fallback Data** - Local mock data when all else fails

## AI Engine Integration (LIVE)

The AI Engine is fully operational and powers the following features:

### Quiz Generation (`src/api/quiz.api.ts`)
- Dynamic quiz generation based on subject and topic
- Intelligent difficulty adjustment
- Detailed explanations for answers
- Fallback to local question bank if AI Engine fails

```typescript
// AI-powered quiz generation
const questions = await quizApi.generatePracticeQuiz(
  "Mathematics",
  "Algebra",
  "medium",
  10
);
```

### Roadmap Generation (`src/api/roadmap.api.ts`)
- Personalized study roadmaps based on exam date and subjects
- AI-generated daily tasks and topics
- Progress tracking and adaptive learning
- Caching to reduce API calls

### Tutor Chat (`src/api/ai-engine.api.ts`)
- Real-time AI tutoring with multiple personalities
- Contextual explanations and follow-up questions
- Song/story mode for creative learning

## Backend API Error Handling

### API Client (`src/api/client.ts`)

The API client includes:
- Automatic token refresh on 401 errors
- Network error detection
- Auth failure handling with redirect
- Request/response interceptors

```typescript
// Token refresh is automatic
// 401 errors trigger logout and redirect

// Check error types
import { isAuthError, isNetworkError, getErrorMessage } from "@/api/client";
```

### Using the useApi Hook (`src/hooks/useApi.ts`)

```typescript
import { useApi } from "@/hooks/useApi";
import { dashboardApi } from "@/api/dashboard.api";

function DashboardComponent() {
  const { 
    data, 
    loading, 
    error, 
    isFallback,
    refetch 
  } = useApi(() => dashboardApi.getDashboard(), {
    autoFetch: true,
    fallbackData: { nickname: "Guest", level: 1, points: 0 },
  });

  if (loading) return <Loading />;
  if (isFallback) return <div>Using offline data</div>;
  
  return <Dashboard data={data} />;
}
```

## Mock Service Worker (MSW)

### Enabling MSW

MSW is automatically enabled in development mode. To control it:

```bash
# Force enable MSW (even in production build)
http://localhost:5173/?msw=true

# Disable MSW to use real API
localStorage.setItem('propella_use_real_api', 'true')
```

### Mock Handlers (`src/mocks/handlers.ts`)

All major API endpoints have mock handlers:
- `/api/dashboard/` - Dashboard stats
- `/api/accounts/subscriptions/plans/` - Subscription plans
- `/api/accounts/referrals/` - Referral stats
- `/api/accounts/token/` - Authentication
- And more...

### Mock Data (`src/mocks/data.ts`)

Centralized mock data for consistent testing:
- User profiles
- Dashboard stats
- Subscription plans
- Referral data
- Quiz questions
- Roadmap data

## Error Boundaries

### Global Error Boundary (`src/components/ErrorBoundary.tsx`)

Catches React rendering errors and shows a fallback UI:

```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

<ErrorBoundary onError={(error, info) => logError(error)}>
  <YourComponent />
</ErrorBoundary>
```

### API Error Boundary

Specialized for API errors with graceful degradation:

```tsx
import { ApiErrorBoundary } from "@/components/ErrorBoundary";

<ApiErrorBoundary fallbackData={<DashboardFallback />}>
  <Dashboard />
</ApiErrorBoundary>
```

## Performance Optimizations

### Debouncing and Throttling (`src/hooks/usePerformance.ts`)

```typescript
import { useDebounce, useThrottle } from "@/hooks/usePerformance";

// Debounce search input
const debouncedSearch = useDebounce((query) => {
  searchAPI(query);
}, 300);

// Throttle scroll handler
const throttledScroll = useThrottle((pos) => {
  updateScrollPosition(pos);
}, 100);
```

### Optimized Callbacks

```typescript
import { useOptimizedCallback } from "@/hooks/usePerformance";

// Uses requestAnimationFrame for smooth performance
const handleScroll = useOptimizedCallback((e) => {
  // Heavy computation here
});
```

### Intersection Observer (Lazy Loading)

```typescript
import { useIntersectionObserver } from "@/hooks/usePerformance";

function LazyComponent() {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <div ref={ref}>
      {isVisible && <HeavyComponent />}
    </div>
  );
}
```

## Troubleshooting

### 401 Unauthorized Errors

1. Check if token exists: `localStorage.getItem('propella_token')`
2. Token refresh is automatic, but if it fails, user is redirected to login
3. To force logout: `localStorage.removeItem('propella_token')`

### 404 Not Found Errors

These are expected for unimplemented backend endpoints. The app will:
1. Try AI Engine (for quiz/roadmap)
2. Fall back to mock data
3. Show a graceful error message

### Network Errors

Network errors are handled automatically:
- UI shows cached/fallback data
- Toast notification indicates offline mode
- Automatic retry on next interaction

### Performance Warnings

"Long running task" warnings can be fixed by:
1. Using `useOptimizedCallback` for event handlers
2. Using `useDebounce` for input handlers
3. Using `useIntersectionObserver` for lazy loading
4. Virtualizing long lists with `useVirtualList`

## Environment Variables

```bash
# AI Engine (LIVE)
VITE_AI_ENGINE_BASE_URL=https://ai-api.propella.ng
VITE_AI_ENGINE_API_KEY=propella_d9bak5LGACyVscLP7sK-vcPkzn7Fzavut-r1AEDE3eM

# Backend API
VITE_API_BASE_URL=https://propella-api.vercel.app/api

# Flutterwave
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxx
```

## Summary

| Feature | Status | Fallback |
|---------|--------|----------|
| Quiz Generation | ✅ AI Engine (Live) | Local question bank |
| Roadmap Generation | ✅ AI Engine (Live) | Local study plan |
| Tutor Chat | ✅ AI Engine (Live) | N/A |
| Dashboard | ⚠️ Mock/Local | Mock data |
| Subscriptions | ⚠️ Mock/Local | Mock data |
| Referrals | ⚠️ Mock/Local | Mock data |
| Authentication | ⚠️ Mock/Local | Mock auth |

The app is fully functional for demo/prototyping with AI-powered features working live!
