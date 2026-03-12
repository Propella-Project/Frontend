/**
 * API Endpoints Configuration
 * 
 * This file centralizes all API endpoints for the Propella backend.
 * Updated to match the Django REST API backend specification.
 * 
 * Base API URL is configured in env.ts (VITE_API_BASE_URL)
 * Default: https://propella-api.vercel.app/api
 * 
 * All paths here are relative to the base URL.
 */

export const ENDPOINTS = {
  // Authentication (JWT)
  // Auth (How_it_works.md §1–6, 15–16)
  auth: {
    login: `/accounts/token/`,
    refresh: `/accounts/token/refresh/`,
    me: `/accounts/me/`,
    register: `/accounts/register/`,
    verifyEmail: `/accounts/verify-email/`,
    resendCode: `/accounts/resend-code/`,
    forgotPassword: `/accounts/forgot-password/`,
    changePassword: `/accounts/change-password/`,
    // POST /api/accounts/reset-password/ body: { token, new_password }
    resetPassword: `/accounts/reset-password/`,
  },

  // User Management (How_it_works.md §7–8)
  users: {
    allUsers: `/accounts/all-users/`,
    editUser: `/accounts/edit-user/`,
  },

  // Exam Profile (How_it_works.md §9–10)
  examProfile: {
    create: `/accounts/create-exam-profile/`,
    edit: `/accounts/edit-exam-profile/`,
  },

  // Referrals (How_it_works.md §11)
  referrals: {
    getStats: `/accounts/my-referrals/`,
  },

  // Subscriptions (How_it_works.md §12–14)
  subscriptions: {
    plans: `/accounts/plans/`,
    paymentConfig: `/accounts/payment-config/`,
    subscribe: `/accounts/subscribe/`,
    verify: `/accounts/verify-subscription/`,
  },

  // Onboarding
  onboarding: {
    examProfile: `/accounts/create-exam-profile/`,
    userSubjects: `/user-subjects/`,
  },

  // Note: No dedicated dashboard endpoint - data comes from subscribe + referrals endpoints

  // Diagnostic Quiz – POST with body { subjects, topic, difficulty, number_of_questions }
  diagnostic: {
    getQuiz: (subject: string) => `/diagnostic-quiz/?subject=${subject}`,
    generateQuiz: `/diagnostic-quiz/`,
    submitResults: `/quiz-results/`,
  },

  // Roadmap (legacy - may need updates based on backend)
  roadmap: {
    getToday: `/roadmap/today/`,
    getByDay: (dayId: string) => `/roadmap/day/${dayId}/`,
    completeTask: (taskId: string) => `/roadmap/tasks/${taskId}/complete/`,
  },

  // Streak (legacy - may need updates based on backend)
  streak: {
    get: `/streak/`,
    update: `/update-streak/`,
  },

  // Performance (legacy - may need updates based on backend)
  performance: {
    getGraph: `/performance-graph/`,
    getLevel: `/user-level/`,
  },

  // AI Tutor (legacy - may need updates based on backend)
  tutor: {
    chat: `/ai-tutor/chat/`,
  },

  // Assignments & Weak Topics (legacy - may need updates based on backend)
  learning: {
    weakTopics: `/weak-topics/`,
    assignments: `/assignments/`,
    completeAssignment: (id: string) => `/assignments/${id}/complete/`,
  },

  // Payments (Flutterwave) (legacy - may need updates based on backend)
  payments: {
    initiate: `/payments/initiate/`,
    verify: `/payments/verify/`,
  },

  // Settings (legacy - may need updates based on backend)
  settings: {
    updateProfile: `/profile/update/`,
    notifications: `/notifications/`,
  },

  // API Schema
  schema: {
    get: `/schema/`,
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
