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
  
  // Check if mocks should be enabled
  const urlParams = new URLSearchParams(window.location.search);
  // ENABLE MOCK BY DEFAULT for demo - remove 'true' to disable
  const enableMsw = urlParams.get("msw") === "true" || import.meta.env.DEV || true;
  
  if (!enableMsw) {
    console.log("[Mock] Mocking disabled. Use ?msw=true to enable.");
    return;
  }
  
  // Check if user wants to use real API
  const useRealApi = localStorage.getItem("propella_use_real_api") === "true";
  if (useRealApi) {
    console.log("[Mock] Using real API. Set propella_use_real_api=false to use mocks.");
    return;
  }
  
  try {
    enableMocks();
    initialized = true;
    console.log("[Mock] API mocking initialized successfully 🎭");
    console.log("[Mock] AI Engine features remain LIVE (quiz, roadmap, tutor)");
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
  console.log("[Mock] API mocking stopped");
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
