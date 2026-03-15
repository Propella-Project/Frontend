/**
 * Mock Service Worker Browser Setup
 * 
 * This module provides API mocking for development.
 * It uses a lightweight fetch interceptor instead of MSW (which requires installation).
 * 
 * To use real MSW instead, install: npm install msw --save-dev
 */

import { enableMocks, disableMocks, isMockingEnabled } from "./handlers";

// Flag to track if mocks are enabled
let initialized = false;

/**
 * Initialize API mocking
 * Only enable in development mode or when explicitly requested
 */
export async function initMocks(): Promise<void> {
  // Prevent double initialization
  if (initialized) return;
  
  // Only enable mocks when explicitly requested (?msw=true); no demo data by default
  const urlParams = new URLSearchParams(window.location.search);
  const enableMsw = urlParams.get("msw") === "true";

  if (!enableMsw) {
    return;
  }

  // Allow opting out via query or localStorage (only read after ?msw=true)
  const useRealApi = typeof window !== "undefined" && localStorage.getItem("propella_use_real_api") === "true";
  if (useRealApi) {
    return;
  }
  
  try {
    enableMocks();
    initialized = true;
  } catch (error) {
    console.error("[Mock] Failed to initialize mocks:", error);
  }
}

/**
 * Stop API mocking
 */
export async function stopMocks(): Promise<void> {
  if (!initialized) return;
  
  disableMocks();
  initialized = false;
}

/**
 * Check if mocking is currently enabled
 */
export function getMockStatus(): boolean {
  return isMockingEnabled();
}

/**
 * Alias for isMockingEnabled
 */
export { isMockingEnabled };

/**
 * Toggle mocking on/off
 */
export async function toggleMocks(enable: boolean): Promise<void> {
  if (enable) {
    localStorage.removeItem("propella_use_real_api");
    window.location.reload();
  } else {
    localStorage.setItem("propella_use_real_api", "true");
    await stopMocks();
    window.location.reload();
  }
}
