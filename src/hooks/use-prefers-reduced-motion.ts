"use client";

import { useSyncExternalStore } from "react";

/**
 * Tracks the user's `prefers-reduced-motion` setting reactively via
 * `useSyncExternalStore` — the idiomatic way to subscribe to an external store
 * (here, a matchMedia query) without setState-in-effect. SSR-safe: the server
 * snapshot is `false`.
 *
 * Use for JS-driven motion that CSS media queries can't reach (e.g. the rAF
 * countdown ring).
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
