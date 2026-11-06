// Ayeh Media Plus - Advanced Offline Service Worker (PWA)
const CACHE_NAME = 'ayeh-cache-v1';
const AUDIO_CACHE_NAME = 'ayeh-audio-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/fonts/antic/kalameh/Kalameh-Bold.woff2',
  '/fonts/antic/kalameh/Kalameh-Regular.woff2',
  '/fonts/antic/peyda/Peyda-Regular.woff2',
  '/fonts/antic/peyda/Peyda-Bold.woff2',
  '/fonts/antic/yekan-bakh/YekanBakh-Regular.woff2',
];

// Install Event: Pre-cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some static assets could not be pre-cached:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== AUDIO_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Smart routing & caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and socket.io
  if (request.method !== 'GET' || url.pathname.startsWith('/socket.io')) {
    return;
  }

  // 1. Audio recitations (.mp3) -> Cache-First
  if (url.pathname.endsWith('.mp3') || url.hostname.includes('everyayah.com') || url.hostname.includes('islamic.network')) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const networkRes = await fetch(request);
          if (networkRes.ok && networkRes.status === 200) {
            cache.put(request, networkRes.clone());
          }
          return networkRes;
        } catch {
          return cached || new Response('Audio unavailable offline', { status: 503 });
        }
      })
    );
    return;
  }

  // 2. Quran API and Surah metadata -> Stale-While-Revalidate
  if (url.hostname.includes('alquran.cloud') || url.pathname.includes('/api/entities/Verse')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((networkRes) => {
          if (networkRes.ok) {
            cache.put(request, networkRes.clone());
          }
          return networkRes;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. Navigation requests (HTML SPA) -> Network-First, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('/index.html') || await cache.match('/');
        return cachedIndex || new Response('<h1>آیه پلاس در حالت آفلاین</h1><p>برای دریافت اطلاعات جدید، اتصال اینترنت خود را بررسی کنید.</p>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      })
    );
    return;
  }

  // 4. Default: Stale-While-Revalidate for app assets
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((networkRes) => {
        if (networkRes.ok && (url.origin === location.origin)) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, networkRes.clone()));
        }
        return networkRes;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
