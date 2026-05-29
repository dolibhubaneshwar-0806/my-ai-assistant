"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[LifeOS SW] Registered:", registration.scope);

        // Check for SW update every 60 seconds
        setInterval(() => registration.update(), 60_000);

        // Activate new SW immediately when available
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((err) => console.warn("[LifeOS SW] Registration failed:", err));

    // Helper: expose a global function to show OS notifications via SW
    (window as any).lifeosNotify = (title: string, body: string, url?: string) => {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "SHOW_NOTIFICATION", title, body, url: url ?? "/chat" });
      });
    };

    // Register periodic background sync if supported
    navigator.serviceWorker.ready.then((reg: any) => {
      if ("periodicSync" in reg) {
        reg.periodicSync
          .register("lifeos-suggestions", { minInterval: 4 * 60 * 60 * 1000 }) // every 4h
          .catch(() => {}); // silently fail (requires HTTPS + permission)
      }
    });
  }, []);

  return null;
}
