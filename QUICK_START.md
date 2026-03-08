# Quick Start Guide - Propella App

## 🚀 Running the App

```bash
cd app
npm run dev
```

The app will start at `http://localhost:5173`

## 🎭 Mock Mode vs Real API

### Development Mode (Default)
- ✅ MSW (Mock Service Worker) is **AUTO-ENABLED**
- All API calls return mock data
- AI Engine features are LIVE (quiz, roadmap, tutor)

### Switch to Real API
```javascript
// In browser console:
localStorage.setItem('propella_use_real_api', 'true');
location.reload();
```

### Back to Mock Mode
```javascript
localStorage.removeItem('propella_use_real_api');
location.reload();
```

## 🧪 Testing AI Features

### Generate a Quiz
```typescript
import { quizApi } from '@/api/quiz.api';

// AI-powered quiz generation
const questions = await quizApi.generatePracticeQuiz(
  "Mathematics",  // subject
  "Algebra",      // topic
  "medium",       // difficulty: easy | medium | hard
  10              // number of questions
);
```

### Generate Roadmap
```typescript
import { roadmapApi } from '@/api/roadmap.api';

// AI generates personalized study plan
const roadmap = await roadmapApi.generateRoadmap();
```

### Chat with AI Tutor
```typescript
import { aiEngineApi } from '@/api/ai-engine.api';

const response = await aiEngineApi.sendMessage({
  message: "Explain quadratic equations",
  tutor_personality: "professor", // mc_flow | professor | mentor | cheerleader
});
```

## 🛡️ Error Handling

### Using useApi Hook
```typescript
import { useApi } from '@/hooks/useApi';

function MyComponent() {
  const { data, loading, error, isFallback, refetch } = useApi(
    () => fetchData(),
    {
      autoFetch: true,
      fallbackData: { /* default data */ },
    }
  );

  if (loading) return <Loading />;
  if (isFallback) return <div>Using offline mode</div>;
  
  return <div>{data}</div>;
}
```

### Error Boundary
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## ⚡ Performance Tips

### Fix Long Handler Warnings
```typescript
import { useDebounce, useOptimizedCallback } from '@/hooks/usePerformance';

// Debounce input handlers
const handleSearch = useDebounce((query) => {
  searchAPI(query);
}, 300);

// Optimize click handlers
const handleClick = useOptimizedCallback(() => {
  // Heavy computation
});
```

### Lazy Load Components
```typescript
import { useIntersectionObserver } from '@/hooks/usePerformance';

function MyComponent() {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <div ref={ref}>
      {isVisible && <HeavyComponent />}
    </div>
  );
}
```

## 🔑 Auth & Tokens

### Check Login Status
```javascript
localStorage.getItem('propella_token'); // null = not logged in
```

### Force Logout
```javascript
localStorage.removeItem('propella_token');
localStorage.removeItem('propella_refresh_token');
location.reload();
```

### Handle 401 Errors
The API client automatically:
1. Attempts token refresh
2. Redirects to login if refresh fails
3. Saves current URL for redirect back

## 🐛 Debugging

### Enable Verbose Logging
```javascript
localStorage.setItem('propella_debug', 'true');
```

### Clear All Caches
```javascript
localStorage.removeItem('propella_roadmap_cache');
localStorage.removeItem('propella_quiz_history');
```

### Check AI Engine Status
```typescript
import { aiEngineApi } from '@/api/ai-engine.api';

const health = await aiEngineApi.healthCheck();
console.log(health); // { status: "healthy", version: "1.0.0" }
```

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `src/api/client.ts` | Axios client with auth & error handling |
| `src/api/ai-engine.api.ts` | AI Engine integration |
| `src/api/quiz.api.ts` | AI-powered quiz |
| `src/api/roadmap.api.ts` | AI-powered roadmap |
| `src/mocks/handlers.ts` | API mocks |
| `src/hooks/useApi.ts` | API hook with fallback |
| `src/hooks/usePerformance.ts` | Performance hooks |
| `src/components/ErrorBoundary.tsx` | Error boundaries |

## ✅ Feature Status

| Feature | Backend | App Behavior |
|---------|---------|--------------|
| Quiz Generation | ✅ AI Engine | Live AI questions |
| Roadmap Generation | ✅ AI Engine | Live AI study plans |
| Tutor Chat | ✅ AI Engine | Live AI responses |
| Dashboard | ⚠️ Mock | Mock data via MSW |
| Subscriptions | ⚠️ Mock | Mock plans |
| Referrals | ⚠️ Mock | Mock stats |
| Auth | ⚠️ Mock | Mock tokens |

## 🆘 Troubleshooting

### "Failed to load quiz"
- Quiz API automatically falls back to local questions
- Check console for AI Engine errors

### "401 Unauthorized"
- Token expired - app will auto-redirect to login
- Or run: `localStorage.removeItem('propella_token')`

### "Network error"
- Check internet connection
- MSW will provide mock data if enabled

### "Long running task" warning
- Wrap handler in `useOptimizedCallback()`
- Or use `useDebounce()` for input handlers
