// Export all hooks
export { usePayment, usePaymentStatus } from "./usePayment";
export { useDashboard } from "./useDashboard";
export { useOnboarding } from "./useOnboarding";
export { useRoadmap } from "./useRoadmap";
export { useQuiz } from "./useQuiz";
export { useTutor } from "./useTutor";
export { useSettings } from "./useSettings";
export { useLearning } from "./useLearning";
export { useStreak } from "./useStreak";
export { useReferral } from "./useReferral";

// New hooks for API handling and performance
export { useApi, useApiWithFallback, useLazyApi, useParallelApi } from "./useApi";
export {
  useDebounce,
  useThrottle,
  useOptimizedCallback,
  useScrollPosition,
  useIntersectionObserver,
  useVirtualList,
  useMemoizedValue,
  useLayoutPaint,
  useLongPress,
  useMeasure,
} from "./usePerformance";
