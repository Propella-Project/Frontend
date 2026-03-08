# Propella API Status

## ✅ LIVE - AI Engine (No Mocking)
These features use the LIVE AI Engine at `https://ai-api.propella.ng`

| Endpoint | File | Status |
|----------|------|--------|
| `/quiz/generate` | `src/api/quiz.api.ts` | ✅ AI-Powered |
| `/roadmap/generate` | `src/api/roadmap.api.ts` | ✅ AI-Powered |
| `/tutor/chat` | `src/api/tutor.api.ts` | ✅ AI-Powered |
| `/tutor/explain` | `src/api/tutor.api.ts` | ✅ AI-Powered |
| `/study/plan` | `src/api/ai-engine.api.ts` | ✅ AI-Powered |
| `/progress/update` | `src/api/ai-engine.api.ts` | ✅ AI-Powered |

## ✅ LIVE - Backend API (Real Endpoints)
These use the real backend at `https://propella-api.vercel.app/api`

| Endpoint | File | Status |
|----------|------|--------|
| `/api/accounts/subscriptions/subscribe/` | `src/api/subscription.api.ts` | ✅ Working |
| `/api/accounts/subscriptions/subscribe/verify/` | `src/api/subscription.api.ts` | ✅ Working |
| `/api/accounts/subscriptions/subscribe/status/` | `src/api/subscription.api.ts` | ✅ Working |
| `/api/accounts/subscriptions/subscribe/cancel/` | `src/api/subscription.api.ts` | ✅ Working |

## 🎭 MOCKED - Development Only
These return mock data when backend returns 404/401 (auto-enabled in dev)

| Endpoint | Mock Data | Fallback |
|----------|-----------|----------|
| `/api/dashboard/` | Dashboard stats | ✅ Yes |
| `/api/accounts/referrals/` | Referral stats | ✅ Yes |
| `/api/accounts/token/` | Auth tokens | ✅ Yes |
| `/api/performance-graph/` | Performance data | ✅ Yes |
| `/api/roadmap/today/` | Today's tasks | ✅ Yes |
| `/api/streak/` | Streak data | ✅ Yes |

## 🔧 Usage

### Enable/Disable Mocks
```javascript
// Use real API everywhere
localStorage.setItem('propella_use_real_api', 'true');
location.reload();

// Use mocks (default in dev)
localStorage.removeItem('propella_use_real_api');
location.reload();
```

### Check What's Being Used
Open browser console and look for:
- `[AI Engine]` - Live AI features
- `[Mock]` - Mocked endpoints
- `[Backend]` - Real backend calls

## 🎯 Quick Test

### Test AI Quiz
```typescript
import { quizApi } from '@/api/quiz.api';
const questions = await quizApi.generatePracticeQuiz("Mathematics", "Algebra", "medium", 5);
```

### Test AI Tutor
```typescript
import { tutorApi } from '@/api/tutor.api';
const response = await tutorApi.sendMessage({
  message: "Explain Newton's laws",
  personality: "Professor Wisdom"
});
```

### Test Subscription (Real Backend)
```typescript
import { subscriptionApi } from '@/api/subscription.api';
const result = await subscriptionApi.subscribe({
  plan_id: "monthly",
  payment_method: "flutterwave"
});
```
