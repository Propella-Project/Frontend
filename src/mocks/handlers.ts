/**
 * MSW Handlers - Mock API Responses
 * Intercepts API calls and returns mock data when backend is unavailable
 * 
 * NOTE: This file provides fallback mocks when MSW is not installed.
 * To use real MSW, install: npm install msw --save-dev
 */

import { ENV } from "@/config/env";
import * as mockData from "./data";

// Extract base URL for pattern matching
const API_BASE = ENV.API_BASE_URL;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// MOCK API IMPLEMENTATION
// ==========================================

// Store original fetch
const originalFetch = window.fetch;

// Mock handlers map
const mockHandlers = new Map<string, (request: Request) => Promise<Response>>();

// Helper to register mock handlers
function registerMock(path: string, handler: (request: Request) => Promise<Response>) {
  mockHandlers.set(`${API_BASE}/${path}`, handler);
}

// Auth handlers
registerMock("accounts/token/", async () => {
  await delay(300);
  return new Response(JSON.stringify(mockData.mockAuthResponse), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

registerMock("accounts/token/refresh/", async () => {
  await delay(200);
  return new Response(JSON.stringify({ access: "mock_refreshed_token_" + Date.now() }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

registerMock("accounts/register/", async () => {
  await delay(300);
  return new Response(
    JSON.stringify({ message: "Registration successful", user_id: "user_new_" + Date.now() }),
    { status: 201, headers: { "Content-Type": "application/json" } }
  );
});

// Dashboard handlers
registerMock("dashboard/", async (request) => {
  await delay(200);
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ detail: "Authentication credentials were not provided." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return new Response(JSON.stringify(mockData.mockDashboardData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

registerMock("performance-graph/", async () => {
  await delay(200);
  return new Response(JSON.stringify(mockData.mockPerformanceData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

registerMock("user-level/", async () => {
  await delay(200);
  return new Response(JSON.stringify(mockData.mockUserLevel), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// Referral handlers
registerMock("accounts/referrals/", async (request) => {
  await delay(200);
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ detail: "Authentication credentials were not provided." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return new Response(JSON.stringify(mockData.mockReferralStats), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// Streak handlers
registerMock("streak/", async () => {
  await delay(150);
  return new Response(JSON.stringify(mockData.mockStreakData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

registerMock("update-streak/", async () => {
  await delay(150);
  return new Response(
    JSON.stringify({ ...mockData.mockStreakData, current_streak: mockData.mockStreakData.current_streak + 1 }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

// Roadmap handlers
registerMock("roadmap/today/", async () => {
  await delay(300);
  return new Response(JSON.stringify(mockData.mockTodayRoadmap), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

registerMock("roadmap/day/", async () => {
  await delay(200);
  return new Response(
    JSON.stringify({
      id: "day_1",
      day_number: 1,
      date: new Date().toISOString().split("T")[0],
      notes: "Focus on core concepts",
      tasks: mockData.mockTodayRoadmap.tasks,
      quiz: mockData.mockTodayRoadmap.quiz,
      progress: 0,
      is_unlocked: true,
      is_completed: false,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

// Quiz handlers
registerMock("diagnostic-quiz/", async (request) => {
  await delay(300);
  const url = new URL(request.url);
  const subject = url.searchParams.get("subject") || "mathematics";
  
  const questions = generateMockQuestions(subject);
  return new Response(JSON.stringify(questions), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

registerMock("quiz-results/", async () => {
  await delay(200);
  return new Response(
    JSON.stringify({ message: "Results submitted", points_earned: 50 }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

// Learning handlers
registerMock("weak-topics/", async () => {
  await delay(200);
  return new Response(JSON.stringify(mockData.mockWeakTopics), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

registerMock("assignments/", async () => {
  await delay(200);
  return new Response(JSON.stringify(mockData.mockAssignments), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// Settings handlers
registerMock("profile/update/", async (request) => {
  await delay(200);
  const body = await request.json();
  return new Response(
    JSON.stringify({ ...mockData.mockUserProfile, ...body }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

registerMock("notifications/", async () => {
  await delay(150);
  return new Response(JSON.stringify(mockData.mockNotifications), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// Exam profile
registerMock("accounts/create-exam-profile/", async () => {
  await delay(300);
  return new Response(
    JSON.stringify({ message: "Profile created", profile_id: "profile_" + Date.now() }),
    { status: 201, headers: { "Content-Type": "application/json" } }
  );
});

// ==========================================
// FETCH INTERCEPTOR
// ==========================================

let isInterceptorEnabled = false;

function createMockFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input.toString();
    
    // Check if we have a mock handler for this URL
    for (const [pattern, handler] of mockHandlers) {
      if (url.includes(pattern) || url.startsWith(pattern)) {
        console.log("[Mock] Intercepted:", url);
        const request = new Request(url, init);
        return handler(request);
      }
    }
    
    // Pass through to original fetch
    return originalFetch(input, init);
  };
}

// ==========================================
// EXPORTS
// ==========================================

/**
 * Enable mock API interception
 */
export function enableMocks(): void {
  if (isInterceptorEnabled) return;
  if (typeof window === "undefined") return;
  
  // Check if user wants to use real API
  if (localStorage.getItem("propella_use_real_api") === "true") {
    console.log("[Mock] Real API mode enabled, skipping mocks");
    return;
  }
  
  window.fetch = createMockFetch();
  isInterceptorEnabled = true;
  console.log("[Mock] API mocking enabled ✓");
  console.log("[Mock] To use real API, run: localStorage.setItem('propella_use_real_api', 'true')");
}

/**
 * Disable mock API interception
 */
export function disableMocks(): void {
  if (!isInterceptorEnabled) return;
  if (typeof window === "undefined") return;
  
  window.fetch = originalFetch;
  isInterceptorEnabled = false;
  console.log("[Mock] API mocking disabled");
}

/**
 * Check if mocks are enabled
 */
export function isMockingEnabled(): boolean {
  return isInterceptorEnabled;
}

/**
 * MSW-compatible handlers export (empty array if MSW not installed)
 */
export const handlers: unknown[] = [];

// Helper function to generate mock questions
function generateMockQuestions(subject: string): Array<{
  subject: string;
  question: string;
  options: string[];
  correct_answer: string;
  allocated_time: number;
}> {
  const questionBank: Record<string, Array<{
    subject: string;
    question: string;
    options: string[];
    correct_answer: string;
    allocated_time: number;
  }>> = {
    mathematics: [
      {
        subject: "Mathematics",
        question: "What is the value of x in 2x + 5 = 15?",
        options: ["3", "4", "5", "6"],
        correct_answer: "5",
        allocated_time: 60,
      },
      {
        subject: "Mathematics",
        question: "What is the square root of 144?",
        options: ["10", "11", "12", "13"],
        correct_answer: "12",
        allocated_time: 45,
      },
    ],
    english: [
      {
        subject: "English",
        question: "Which word is a synonym for 'happy'?",
        options: ["Sad", "Joyful", "Angry", "Tired"],
        correct_answer: "Joyful",
        allocated_time: 30,
      },
    ],
    physics: [
      {
        subject: "Physics",
        question: "What is the SI unit of force?",
        options: ["Watt", "Newton", "Joule", "Pascal"],
        correct_answer: "Newton",
        allocated_time: 45,
      },
    ],
  };
  
  return questionBank[subject.toLowerCase()] || questionBank.mathematics;
}
