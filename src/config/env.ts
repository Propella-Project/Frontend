// Environment Configuration
export const ENV = {
  // Main Backend API - Propella Django Backend
  // Note: The API endpoints are under /api path
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "https://api.propella.ng/api",
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || "30000"),
  
  // Landing page URL for redirects
  LANDING_PAGE_URL: import.meta.env.VITE_LANDING_PAGE_URL || "https://propella.ng",
  LOGIN_PAGE_URL: import.meta.env.VITE_LOGIN_PAGE_URL || "https://propella.ng/login",
  
  // Dashboard URL
  DASHBOARD_URL: import.meta.env.VITE_DASHBOARD_URL || "https://dashboard.propella.ng",
  
  // AI Engine API
  AI_ENGINE_BASE_URL: import.meta.env.VITE_AI_ENGINE_BASE_URL || "https://ai-api.propella.ng",
  AI_ENGINE_API_KEY: import.meta.env.VITE_AI_ENGINE_API_KEY || "propella_d9bak5LGACyVscLP7sK-vcPkzn7Fzavut-r1AEDE3eM",
  AI_ENGINE_TIMEOUT: parseInt(import.meta.env.VITE_AI_ENGINE_TIMEOUT || "60000"),
  
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
