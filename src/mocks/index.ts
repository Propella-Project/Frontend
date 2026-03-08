/**
 * MSW (Mock Service Worker) Integration
 * 
 * This module provides API mocking for development and demo purposes.
 * When enabled, it intercepts API calls and returns mock data instead of hitting the real backend.
 * 
 * Usage:
 * - MSW is auto-enabled in development mode
 * - Add ?msw=true to URL to force enable
 * - Run localStorage.setItem('propella_use_real_api', 'true') to disable mocks
 */

import { initMocks, stopMocks, isMockingEnabled, toggleMocks } from "./browser";

export { initMocks, stopMocks, isMockingEnabled, toggleMocks };

// Re-export mock data for use in tests or stories
export * from "./data";
export { handlers } from "./handlers";
