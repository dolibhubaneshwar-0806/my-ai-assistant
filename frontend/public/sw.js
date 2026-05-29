// AI LifeOS Service Worker — v2 Night Mode
const CACHE_NAME = "lifeos-cache-v2";

const ASSETS_TO_CACHE = [
  "/dashboard",
  "/chat",
  "/settings",
  "/fitness",
  "/planner",
  "/study",
  "/manifest.json",
  "/favicon.ico",
];

// ── Install: cache static assets ──────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          fetch(url)
            .then((res) => { if (res.ok) return cache.put(url, res); })
            .catch(() => {})
        )
      )
    )
  );
  self.skipWaiting();
});

// ── Activate: prune old caches ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ─────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return; // never cache API calls

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          if (!res || res.status !== 200 || res.type !== "basic") return res;
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match("/dashboard"));
    })
  );
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "AI LifeOS", body: "You have a new notification.", icon: "/icon-192.png", tag: "lifeos-push" };
  try { data = { ...data, ...event.data.json() }; } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "lifeos-push",
      vibrate: [100, 50, 100],
      data: { url: data.url || "/dashboard" },
      actions: [
        { action: "open",    title: "Open App" },
        { action: "dismiss", title: "Dismiss"  },
      ],
    })
  );
});

// ── Periodic background sync for AI suggestions ────────────────────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "lifeos-suggestions") {
    event.waitUntil(
      self.registration.showNotification("AI LifeOS Tip", {
        body: "Don't forget to review your goals for today! 🎯",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "lifeos-tip",
        silent: false,
        vibrate: [80, 40, 80],
      })
    );
  }
});

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ── Message handler (from app) ────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const { title, body, tag, url } = event.data;
    self.registration.showNotification(title || "AI LifeOS", {
      body: body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: tag || "lifeos-msg",
      vibrate: [60, 30, 60],
      data: { url: url || "/chat" },
    });
  }

  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
