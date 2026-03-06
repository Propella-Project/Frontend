// Environment Configuration
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "https://propella-api.vercel.app",
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || "30000"),
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
} as const;

// Feature flags
export const FEATURES = {
  ENABLE_AI_VOICE: true,
  ENABLE_PAYMENT: true,
  ENABLE_STREAK_NOTIFICATIONS: true,
} as const;
