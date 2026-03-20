/* eslint-disable no-restricted-globals */

/**
 * Cóndor Salud — Service Worker
 * Provides offline caching + network-first strategy for API calls.
 */

const CACHE_NAME = "condor-salud-v2";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/offline",
  "/favicon.png",
  "/icon-192.png",
  "/icon-512.png",
];

// Install: precache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // API calls: network first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || new Response("{}", { status: 503 }))),
    );
    return;
  }

  // Static assets: cache first, fallback to network
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?|ico)$/) ||
    url.pathname.startsWith("/_next/static")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          }),
      ),
    );
    return;
  }

  // Navigation: network first, fallback to offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline").then((r) => r || caches.match("/"))),
    );
    return;
  }
});

// ─── Push Notifications ──────────────────────────────────────
// Receives push events from the server and shows a notification.

self.addEventListener("push", (event) => {
  let data = { title: "Cóndor Salud", body: "Nueva notificación", url: "/dashboard/alertas" };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    // If payload isn't JSON, use text as body
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: "condor-salud-notification",
    renotify: true,
    data: { url: data.url || "/dashboard/alertas" },
    actions: [
      { action: "open", title: "Abrir" },
      { action: "dismiss", title: "Cerrar" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/dashboard/alertas";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if available
        for (const client of clients) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(targetUrl);
      }),
  );
});

// ─── Background Sync ─────────────────────────────────────────
// Retries failed API requests when connectivity is restored.

self.addEventListener("sync", (event) => {
  if (event.tag === "condor-salud-sync") {
    event.waitUntil(replayOfflineQueue());
  }
});

async function replayOfflineQueue() {
  try {
    const cache = await caches.open("condor-salud-offline-queue");
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        const cachedResponse = await cache.match(request);
        if (!cachedResponse) continue;

        // The cached response body contains the original request payload
        const payload = await cachedResponse.json();

        const response = await fetch(payload.url, {
          method: payload.method || "POST",
          headers: payload.headers || { "Content-Type": "application/json" },
          body: payload.body ? JSON.stringify(payload.body) : undefined,
        });

        if (response.ok) {
          await cache.delete(request);
        }
      } catch {
        // Will retry on next sync event
      }
    }
  } catch {
    // Queue doesn't exist yet or is empty
  }
}
