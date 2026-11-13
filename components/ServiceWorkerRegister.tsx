"use client";
import { useEffect } from "react";

// Registers the offline-fallback service worker (production only, so the dev
// server is never served stale responses).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* optional enhancement */ });
  }, []);
  return null;
}
