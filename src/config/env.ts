// Environment Configuration
// VITE_API_BASE_URL = backend base URL (e.g. https://propella-api.vercel.app or .../api)
const rawApiBase = (import.meta.env.VITE_API_BASE_URL || "https://propella-api.vercel.app/api").replace(/\/$/, "");
const API_BASE_URL = rawApiBase.endsWith("/api") ? rawApiBase : `${rawApiBase}/api`;

export const ENV = {
  // Main Backend API (no trailing slash; used as base for /accounts/..., etc.)
  API_BASE_URL,
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || "30000"),
  
  // AI Engine API
  AI_ENGINE_BASE_URL: import.meta.env.VITE_AI_ENGINE_BASE_URL || "https://ai-api.propella.ng",
  AI_ENGINE_API_KEY: import.meta.env.VITE_AI_ENGINE_API_KEY || "propella_d9bak5LGACyVscLP7sK-vcPkzn7Fzavut-r1AEDE3eM",
  AI_ENGINE_TIMEOUT: parseInt(import.meta.env.VITE_AI_ENGINE_TIMEOUT || "60000"),
  
  // URLs
  LANDING_PAGE_URL: import.meta.env.VITE_LANDING_PAGE_URL || "https://propella.ng",

  // Flutterwave public key (for flutterwave-react-v3; safe to expose - public key only)
  FLUTTERWAVE_PUBLIC_KEY: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "",

  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
} as const;

// Feature flags
export const FEATURES = {
  ENABLE_AI_VOICE: true,
  ENABLE_PAYMENT: true,
  ENABLE_STREAK_NOTIFICATIONS: true,
  ENABLE_AI_ENGINE: true, // Use AI Engine for quiz/roadmap generation
} as const;
