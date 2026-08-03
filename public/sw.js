/**
 * Service Worker - PWA Offline Capabilities & Caching
 */

const CACHE_NAME = 'todo-list-v6';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/storage.js',
  './js/auth.js',
  './js/sound.js',
  './js/confetti.js',
  './js/app.js',
  './manifest.json',
  './icons/logo_v3.jpg',
  './icons/clean_avatar_boy.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
