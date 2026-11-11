/* Offline support. After the first visit, the app and all lessons work with no internet.
   When you change app files, change VERSION (fs-v2, fs-v3...) so phones pick up the new files. */
const VERSION = 'fs-v4';
const DATA = ['lessons.json', 'ui-text.json']; // always try the internet first for these
const FILES = [
  './',
  'index.html',
  'style.css',
  'js/storage.js',
  'js/content.js',
  'js/app.js',
  ...DATA,
  'edit.html',
  'js/edit.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'fonts/fonts.css',
  'fonts/noto-sans-latin.woff2',
  'fonts/noto-sans-special.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(FILES);
    await cacheMedia(cache);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== VERSION).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

// Also save every picture and recording named in the files, so they work offline too.
// Recordings live in one folder per language: audio/french/bonjour.mp3, audio/susu/bonjour.mp3...
async function cacheMedia(cache) {
  try {
    const data = await (await cache.match('lessons.json')).json();
    const ui = await (await cache.match('ui-text.json')).json();
    const codes = Object.keys(ui.languages || {});
    const names = [];
    Object.values(ui.languages || {}).forEach((l) => { if (l.audio) names.push(l.audio.includes('/') ? l.audio : 'audio/' + l.audio); });
    (data.lessons || []).forEach((l) => (l.words || []).forEach((w) => {
      if (w.picture) names.push(w.picture.includes('/') ? w.picture : 'pictures/' + w.picture);
      if (w.audio) {
        const file = /\.[a-z0-9]{2,4}$/i.test(w.audio) ? w.audio : w.audio + '.mp3';
        if (w.audio.includes('/')) names.push(w.audio);
        else codes.forEach((c) => names.push('audio/' + c + '/' + file));
      }
    }));
    await Promise.all(names.filter((n) => !n.includes(':')).map((n) => cache.add(n).catch(() => {})));
  } catch (e) { /* a file is missing or broken: the app shows the error */ }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // lessons.json and ui-text.json: try the internet first (to get new words), use the saved copy when offline.
  const dataFile = DATA.find((name) => new URL(req.url).pathname.endsWith('/' + name));
  if (dataFile) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        if (fresh.ok) {
          await cache.put(dataFile, fresh.clone());
          cacheMedia(cache);
        }
        return fresh;
      } catch (e) {
        return (await cache.match(dataFile)) || Response.error();
      }
    })());
    return;
  }

  // Everything else: use the saved copy first (fast, no data used), else download and save it.
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const saved = await cache.match(req, { ignoreSearch: true });
    if (saved) return saved;
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (e) {
      if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
      return Response.error();
    }
  })());
});
