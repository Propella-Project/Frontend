# PROPELLA API Integration Guide

This document describes the API integration layer that connects the React frontend to the Django REST API backend.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd app
   npm install
   ```

2. **Set environment variables (optional):**
   Create a `.env` file in the `app` directory:
   ```
   VITE_API_BASE_URL=https://propella-api.vercel.app
   VITE_API_TIMEOUT=30000
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

## Architecture Overview

### Folder Structure

```
src/
├── api/                    # API layer
│   ├── client.ts          # Axios client configuration
│   ├── endpoints.ts       # API endpoint definitions
│   ├── auth.api.ts        # Authentication APIs
│   ├── dashboard.api.ts   # Dashboard APIs
│   ├── onboarding.api.ts  # Onboarding APIs
│   ├── roadmap.api.ts     # Roadmap APIs
│   ├── quiz.api.ts        # Quiz APIs
│   ├── tutor.api.ts       # AI Tutor APIs
│   ├── payment.api.ts     # Payment APIs
│   └── settings.api.ts    # Settings APIs
├── state/                 # Global state management
│   ├── user.store.ts     # User state (Zustand)
│   └── app.store.ts      # App state (Zustand)
├── hooks/                 # Custom React hooks
│   ├── useDashboard.ts
│   ├── useOnboarding.ts
│   ├── useRoadmap.ts
│   ├── useQuiz.ts
│   ├── useTutor.ts
│   ├── usePayment.ts
│   ├── useSettings.ts
│   └── useLearning.ts
├── utils/                 # Utility functions
│   ├── greeting.ts       # Time-based greetings
│   ├── time.ts          # Time utilities
│   ├── formatScore.ts   # Score formatting
│   └── constants.ts     # App constants
├── features/              # Feature components
│   ├── settings/
│   │   └── SettingsDropdown.tsx
│   └── payment/
│       └── PaymentModal.tsx
└── config/               # Configuration
    ├── env.ts           # Environment variables
    └── endpoints.txt    # API documentation
```

## Global State

### User State (`useUserStore`)

Stores user information available across all pages:

```typescript
{
  user_id: string;
  nickname: string;
  rank: string;
  level: number;
  points: number;
  streak: number;
  subjects: string[];
  ai_tutor_selected: string;
  ai_voice_enabled: boolean;
  payment_status: "pending" | "paid" | "failed";
}
```

### App State (`useAppStore`)

Stores application data shared across pages:

```typescript
{
  roadmap: RoadmapDay[];
  todayRoadmap: TodayRoadmapResponse | null;
  todayTasks: Task[];
  quizProgress: QuizProgress | null;
  diagnosticQuiz: DiagnosticQuizState | null;
  tutorSession: ChatMessage[];
  weakTopics: WeakTopic[];
  notifications: Notification[];
  paymentStatus: "pending" | "paid" | "failed";
  roadmapGenerationStatus: "loading" | "ready" | "error";
  performanceGraph: PerformanceDataPoint[];
  assignments: Assignment[];
}
```

## API Hooks Usage

### Dashboard

```typescript
import { useDashboard, usePerformanceGraph } from "@/hooks";

function MyComponent() {
  const { data, loading, error, refetch } = useDashboard();
  const { data: graphData } = usePerformanceGraph();
  
  // data contains: nickname, rank, level, points, average_score, etc.
}
```

### Onboarding

```typescript
import { useOnboarding } from "@/hooks";

function OnboardingComponent() {
  const { 
    loading, 
    saveExamProfile, 
    saveSubjects, 
    fetchDiagnosticQuiz,
    submitDiagnosticResults 
  } = useOnboarding();
  
  // Save exam profile
  await saveExamProfile({
    nickname: "John",
    exam_date: "2026-05-20",
    study_hours_per_day: 4,
    ai_tutor_selected: "Professor Wisdom",
    ai_voice_enabled: true
  });
  
  // Save subjects (must be exactly 4)
  await saveSubjects({
    subjects: ["Mathematics", "English", "Physics", "Chemistry"]
  });
}
```

### Roadmap

```typescript
import { useRoadmap } from "@/hooks";

function RoadmapComponent() {
  const { 
    todayRoadmap, 
    loading, 
    refetch, 
    completeTask 
  } = useRoadmap();
  
  // Complete a task
  await completeTask("task_id");
}
```

### AI Tutor

```typescript
import { useTutor, useTutorSession } from "@/hooks";

function TutorComponent() {
  const { sendMessage, loading } = useTutor();
  const { messages } = useTutorSession();
  
  // Send message to AI tutor
  await sendMessage("Explain Newton's laws");
}
```

### Payment

```typescript
import { usePayment, usePaymentStatus } from "@/hooks";

function PaymentComponent() {
  const { initiatePayment, verifyPayment } = usePayment();
  const { isPaid } = usePaymentStatus();
  
  // Initiate payment
  const transactionRef = await initiatePayment(
    "user@email.com",
    "User Name",
    "08012345678"
  );
  
  // Verify payment
  await verifyPayment(transactionRef);
}
```

### Settings

```typescript
import { useSettings, useNotifications } from "@/hooks";

function SettingsComponent() {
  const { updateProfile } = useSettings();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  // Update profile
  await updateProfile({
    nickname: "New Name",
    ai_tutor_selected: "MC Flow",
    ai_voice_enabled: true
  });
}
```

## Authentication

The API client automatically attaches the Bearer token to all requests:

```typescript
// Token is stored in localStorage
localStorage.setItem("propella_token", "your_token_here");

// All subsequent requests include:
// Authorization: Bearer your_token_here
```

## Error Handling

All hooks return error states that can be used to display UI feedback:

```typescript
const { data, loading, error } = useDashboard();

if (loading) return <Loader />;
if (error) return <ErrorMessage message={error.message} />;
return <Dashboard data={data} />;
```

## Switching to Mock Endpoints

To use mock endpoints during development:

1. Open `src/config/endpoints.ts`
2. Change the export:
   ```typescript
   export const ACTIVE_ENDPOINTS = MOCK_ENDPOINTS;
   ```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `https://propella-api.vercel.app` | API base URL |
| `VITE_API_TIMEOUT` | `30000` | Request timeout in ms |

## Key Features

1. **Global State**: User and app state are stored in Zustand with persistence
2. **Cached Data**: API hooks cache data to prevent unnecessary requests
3. **Automatic Token Handling**: Axios interceptor adds auth token to requests
4. **Error Handling**: Consistent error handling across all API calls
5. **Loading States**: Loading states for UI feedback
6. **Type Safety**: Full TypeScript support for all API responses

## New Components

### SettingsDropdown

Replaces the settings button in Dashboard with a dropdown menu:
- Profile Edit (nickname, AI tutor, voice toggle)
- Notifications list
- Logout

### PaymentModal

Modal for Flutterwave payment integration:
- Payment form
- Processing state
- Verification step

## Utilities

### Greeting

```typescript
import { getGreeting, getPersonalizedGreeting } from "@/utils/greeting";

getGreeting(); // "Good morning" | "Good afternoon" | "Good evening"
getPersonalizedGreeting("John"); // "Good morning, John"
```

### Time

```typescript
import { getNigeriaTime, formatNigeriaDate } from "@/utils/time";

getNigeriaTime(); // Current time in Nigeria
formatNigeriaDate(new Date()); // Formatted date string
```

### Score Formatting

```typescript
import { formatScore, getScoreColor } from "@/utils/formatScore";

formatScore(75, 100); // "75%"
getScoreColor(75); // Color hex code
```

## API Documentation

See `src/config/endpoints.txt` for a complete list of all API endpoints.

## Notes

- Authentication is already implemented and should not be modified
- All API calls are centralized in the `src/api` folder
- UI components remain unchanged except for API integration points
- The existing `useStore` from `@/store` is kept for backward compatibility
