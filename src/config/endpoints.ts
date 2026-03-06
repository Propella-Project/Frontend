/**
 * API Endpoints Configuration
 * 
 * This file centralizes all API endpoints for easy switching between
 * mock and production endpoints.
 */

const BASE_URL = "https://propella-api.vercel.app";

export const ENDPOINTS = {
  // Authentication (already implemented)
  auth: {
    login: `${BASE_URL}/auth/login/`,
    signup: `${BASE_URL}/auth/signup/`,
    refresh: `${BASE_URL}/auth/refresh/`,
    logout: `${BASE_URL}/auth/logout/`,
  },

  // Onboarding
  onboarding: {
    examProfile: `${BASE_URL}/api/accounts/create-exam-profile/`,
    userSubjects: `${BASE_URL}/user-subjects/`,
  },

  // Dashboard
  dashboard: {
    get: `${BASE_URL}/dashboard/`,
  },

  // Diagnostic Quiz
  diagnostic: {
    getQuiz: (subject: string) => `${BASE_URL}/diagnostic-quiz/?subject=${subject}`,
    submitResults: `${BASE_URL}/quiz-results/`,
  },

  // Roadmap
  roadmap: {
    getToday: `${BASE_URL}/roadmap/today/`,
    getByDay: (dayId: string) => `${BASE_URL}/roadmap/day/${dayId}/`,
    completeTask: (taskId: string) => `${BASE_URL}/roadmap/tasks/${taskId}/complete/`,
  },

  // Streak
  streak: {
    get: `${BASE_URL}/streak/`,
    update: `${BASE_URL}/update-streak/`,
  },

  // Performance
  performance: {
    getGraph: `${BASE_URL}/performance-graph/`,
    getLevel: `${BASE_URL}/user-level/`,
  },

  // AI Tutor
  tutor: {
    chat: `${BASE_URL}/ai-tutor/chat/`,
  },

  // Assignments & Weak Topics
  learning: {
    weakTopics: `${BASE_URL}/weak-topics/`,
    assignments: `${BASE_URL}/assignments/`,
    completeAssignment: (id: string) => `${BASE_URL}/assignments/${id}/complete/`,
  },

  // Payments (Flutterwave)
  payments: {
    initiate: `${BASE_URL}/payments/initiate/`,
    verify: `${BASE_URL}/payments/verify/`,
  },

  // Settings
  settings: {
    updateProfile: `${BASE_URL}/profile/update/`,
    notifications: `${BASE_URL}/notifications/`,
  },
} as const;

// Export for easy swapping to mock endpoints during development
export const MOCK_ENDPOINTS = {
  // Add mock endpoints here when needed
  dashboard: {
    get: "/mock/dashboard.json",
  },
} as const;

// Current active endpoints (switch between ENDPOINTS and MOCK_ENDPOINTS)
export const ACTIVE_ENDPOINTS = ENDPOINTS;
