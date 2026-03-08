/**
 * Utility function to reset the app to onboarding state
 * This clears all persisted state from localStorage and resets the app stores
 */

import { useStore } from "@/store";
import { useAppStore } from "@/state/app.store";

/**
 * Resets the entire application to its initial state,
 * returning the user to the onboarding flow
 */
export function resetAppToOnboarding(): void {
  // Clear localStorage keys used by Zustand persist
  localStorage.removeItem("propella-storage");
  localStorage.removeItem("propella-app-store");

  // Reset the main store using its resetApp action
  useStore.getState().resetApp();

  // Reset the app store
  useAppStore.getState().resetAppState();

  // Force a page reload to ensure clean state
  // This ensures all React components re-render with fresh state
  window.location.reload();
}

/**
 * Alternative: Reset only onboarding state (keeps other data)
 * Use this if you want to restart onboarding but preserve other progress
 */
export function resetOnboardingOnly(): void {
  // Reset the main store's onboarding state
  useStore.getState().resumeOnboarding();
}
