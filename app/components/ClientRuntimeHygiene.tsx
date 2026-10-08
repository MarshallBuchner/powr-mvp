"use client";

import { useEffect } from "react";

/**
 * POWR does not ship a service worker. Accidental registrations (extensions,
 * old experiments, or other origins on the same device profile) can make
 * regular Safari keep a stale app shell while Private Browsing looks fine.
 *
 * This effect best-effort unregisters any service workers for this origin.
 * It does not clear HTTP cache or localStorage — those require an explicit
 * Safari "Website Data" clear by the user when debugging.
 */
export default function ClientRuntimeHygiene() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (cancelled || regs.length === 0) return;
        await Promise.all(regs.map((reg) => reg.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      } catch {
        // Hygiene must never break the product.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
