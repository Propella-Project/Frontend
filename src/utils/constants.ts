/**
 * Application Constants
 */

// App Information
export const APP_NAME = "PROPELLA";
export const APP_VERSION = "1.0.0";
export const APP_TAGLINE = "Your AI JAMB Tutor";

// Study Configuration
export const MAX_SUBJECTS = 4;
export const MIN_STUDY_HOURS = 1;
export const MAX_STUDY_HOURS = 8;
export const DEFAULT_STUDY_HOURS = 2;

// Quiz Configuration
export const DIAGNOSTIC_QUESTIONS_PER_SUBJECT = 3;
export const DIAGNOSTIC_TOTAL_QUESTIONS = 12;
export const DEFAULT_QUIZ_TIME_PER_QUESTION = 30; // seconds

// Points Configuration
export const POINTS_PER_CORRECT_ANSWER = 10;
export const POINTS_PER_COMPLETED_TASK = 25;
export const POINTS_PER_COMPLETED_DAY = 100;
export const POINTS_STREAK_BONUS = 50;

// Level Configuration
export const POINTS_PER_LEVEL = 500;
export const MAX_LEVEL = 100;

// Streak Configuration
export const STREAK_WARNING_DAYS = 2; // Warn user if they haven't studied in 2 days

/** Roadmap lesson notes: bundled dummy HTML unless VITE_USE_DUMMY_NOTES=false */
export const USE_DUMMY_ROADMAP_NOTES =
  import.meta.env.VITE_USE_DUMMY_NOTES !== "false";

// Payment Configuration
export const PAYMENT_CURRENCY = "NGN";
export const PAYMENT_AMOUNT = 5000; // Default amount in Naira

// AI Tutor Personalities
export const AI_TUTORS = [
  { id: "mentor", name: "Professor Wisdom", avatar: "🦉", tone: "calm" },
  { id: "coach", name: "Sergeant Drill", avatar: "🎖️", tone: "strict" },
  { id: "rapper", name: "MC Flow", avatar: "🎤", tone: "energetic" },
  { id: "football", name: "Coach Victor", avatar: "⚽", tone: "energetic" },
  { id: "storyteller", name: "Nana Aisha", avatar: "📚", tone: "calm" },
] as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "propella_token",
  REFRESH_TOKEN: "propella_refresh_token",
  USER: "propella-user-store",
  APP: "propella-app-store",
  ONBOARDING_COMPLETE: "propella_onboarding_complete",
} as const;

// API Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "Session expired. Please log in again.",
  SERVER_ERROR: "Something went wrong. Please try again.",
  NOT_FOUND: "Resource not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  PAYMENT_REQUIRED: "Payment required to access this feature.",
  ROADMAP_GENERATING: "Your roadmap is still being generated. Please wait...",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: "Profile updated successfully!",
  TASK_COMPLETED: "Task completed! Keep it up!",
  ASSIGNMENT_COMPLETED: "Assignment completed!",
  STREAK_UPDATED: "Streak updated! You're on fire! 🔥",
  PAYMENT_SUCCESS: "Payment successful! Welcome to PROPELLA!",
  QUIZ_SUBMITTED: "Quiz submitted! Great job!",
} as const;
