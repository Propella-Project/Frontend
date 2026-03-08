/* Mock Service Worker - Manual implementation for demo */
/* This is a simplified version - in production, run: npx msw init public */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // This is a placeholder - the actual MSW library handles this
  // For now, requests will pass through to the network
});
