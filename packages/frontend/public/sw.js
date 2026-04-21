// AirDelivery Service Worker
const CACHE_NAME = 'airdelivery-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Simple fetch listener to handle PWA behavior
self.addEventListener('fetch', (event) => {
  // We can add caching logic here later if needed
});

// Background sync / keep-alive hint
self.addEventListener('message', (event) => {
  if (event.data === 'KEEP_ALIVE') {
    // This empty listener helps keep the worker active
    console.log('[SW] Keep-alive heartbeat received');
  }
});
