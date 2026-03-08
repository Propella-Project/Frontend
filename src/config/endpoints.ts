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
  auth: {
    // POST - Login to get access/refresh tokens
    login: `/accounts/token/`,
    // POST - Refresh access token
    refresh: `/accounts/token/refresh/`,
    // POST - Register new user
    register: `/accounts/register/`,
    // POST - Verify email with code
    verifyEmail: `/accounts/verify-email/`,
    // POST - Resend verification code
    resendCode: `/accounts/resend-code/`,
    // POST - Request password reset
    forgotPassword: `/accounts/forgot-password/`,
    // PUT/PATCH - Change password (authenticated)
    changePassword: `/accounts/change-password/`,
    // POST - Reset password with uid/token
    resetPassword: (uid: string, token: string) => `/accounts/reset-password/${uid}/${token}/`,
  },

  // User Management
  users: {
    // GET - Get all users (admin)
    allUsers: `/accounts/all-users/`,
    // PUT/PATCH - Edit user by ID
    editUser: (userId: string) => `/accounts/edit-user/${userId}/`,
  },

  // Exam Profile
  examProfile: {
    // POST - Create exam profile
    create: `/accounts/create-exam-profile/`,
    // PUT/PATCH - Edit exam profile
    edit: (profileId: string) => `/accounts/edit-exam-profile/${profileId}/`,
  },

  // Referrals
  referrals: {
    // GET - Get referral stats for current user
    getStats: `/accounts/referrals/`,
  },

  // Subscriptions
  subscriptions: {
    // GET - Get available subscription plans (requires auth)
    plans: `/accounts/plans`,
    // POST - Subscribe to a plan (requires auth, plan_id in body)
    subscribe: `/accounts/subscribe`,
    // GET - Verify subscription after Flutterwave payment (requires transaction_id)
    verify: `/accounts/verify-subscription`,
  },

  // Onboarding (legacy - may need updates based on backend)
  onboarding: {
    examProfile: `/accounts/create-exam-profile/`,
    userSubjects: `/user-subjects/`,
  },

  // Note: No dedicated dashboard endpoint - data comes from subscribe + referrals endpoints

  // Diagnostic Quiz (legacy - may need updates based on backend)
  diagnostic: {
    getQuiz: (subject: string) => `/diagnostic-quiz/?subject=${subject}`,
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
