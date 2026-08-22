import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/lib/redis";
import { NextRequest } from "next/server";

/**
 * Sliding-window-free rate limiters backed by the same Upstash Redis instance.
 *
 * Optimized for Redis command usage:
 *  - `fixedWindow` costs a single INCR (+ occasional EXPIRE) per check, roughly
 *    half the commands of a sliding window, at the cost of allowing up to ~2x
 *    the limit at a window boundary — fine for abuse prevention.
 *  - `ephemeralCache` short-circuits already-blocked identifiers in process
 *    memory, so a flood from one IP stops touching Redis entirely.
 *  - `analytics: false` avoids the extra per-request analytics writes.
 *
 * Built lazily so no Redis client is constructed at import/build time.
 */
let createLimiter: Ratelimit | null = null;
let readLimiter: Ratelimit | null = null;

// Shared across requests within a single server instance.
const createCache = new Map<string, number>();
const readCache = new Map<string, number>();

export function getCreateLimiter(): Ratelimit {
  if (!createLimiter) {
    createLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.fixedWindow(10, "60 s"),
      analytics: false,
      prefix: "rl:create",
      ephemeralCache: createCache,
    });
  }
  return createLimiter;
}

export function getReadLimiter(): Ratelimit {
  if (!readLimiter) {
    readLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.fixedWindow(30, "60 s"),
      analytics: false,
      prefix: "rl:read",
      ephemeralCache: readCache,
    });
  }
  return readLimiter;
}

/** Best-effort client identifier from proxy headers, falling back to a constant. */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}
