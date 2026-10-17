/* Nexus service worker.
 *
 * Strategy:
 *   - navigations  -> network-first, fall back to the cached shell (offline works)
 *   - same-origin  -> cache-first, then network (Vite output is content-hashed)
 *   - cross-origin -> untouched. Provider APIs (Groq / OpenRouter / Ollama / …)
 *     must never be served from, or written to, the cache.
 *
 * All paths are relative so the app works from any sub-path (e.g. /nexus/app/).
 */

const PREFIX = 'nexus-'
const CACHE = `${PREFIX}shell-v1`
const CORE = [
  './',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/pwa-192.png',
  './icons/pwa-512.png',
  './icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await Promise.all(
        CORE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => {}),
        ),
      )
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // never touch provider traffic

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          if (fresh && fresh.ok) {
            const cache = await caches.open(CACHE)
            cache.put('./', fresh.clone())
          }
          return fresh
        } catch {
          const cache = await caches.open(CACHE)
          return (await cache.match('./')) || (await cache.match(request)) || Response.error()
        }
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const hit = await cache.match(request)
      if (hit) return hit
      try {
        const res = await fetch(request)
        if (res.ok && res.type === 'basic') cache.put(request, res.clone())
        return res
      } catch {
        return hit || Response.error()
      }
    })(),
  )
})
