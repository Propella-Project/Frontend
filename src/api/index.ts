// Export all API modules
export { default as apiClient } from "./client";
export { authApi } from "./auth.api";
export { dashboardApi } from "./dashboard.api";
export { onboardingApi } from "./onboarding.api";
export { roadmapApi } from "./roadmap.api";
export { streakApi } from "./streak.api";
export { tutorApi } from "./tutor.api";
export { learningApi } from "./learning.api";
export { paymentApi } from "./payment.api";
export { settingsApi } from "./settings.api";
export { quizApi } from "./quiz.api";
export { referralApi } from "./referral.api";
export { subscriptionApi } from "./subscription.api";
export { aiEngineApi } from "./ai-engine.api";
export { studyRoadmapApi } from "./study-roadmap.api";

// Export client utilities
export {
  getToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isAuthError,
  isNetworkError,
  getErrorMessage,
} from "./client";
