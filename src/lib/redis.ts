import { Redis } from "@upstash/redis";

/**
 * Upstash Redis client, configured from environment variables:
 *   - UPSTASH_REDIS_REST_URL
 *   - UPSTASH_REDIS_REST_TOKEN
 *
 * Used server-side only to store opaque ciphertext blobs with a TTL.
 * Constructed lazily so importing this module (e.g. during a build) never
 * touches the environment or logs missing-config warnings.
 */
let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = Redis.fromEnv();
  }
  return client;
}

/** Redis key namespace for stored secrets. */
export function secretKey(id: string): string {
  return `secret:${id}`;
}

/** Expiry options offered to the user, mapped to a TTL in seconds. */
export const EXPIRY_OPTIONS = {
  "5m": 5 * 60,
  "1h": 60 * 60,
  "1d": 24 * 60 * 60,
  "7d": 7 * 24 * 60 * 60,
} as const;

export type ExpiryOption = keyof typeof EXPIRY_OPTIONS;

export function isExpiryOption(value: unknown): value is ExpiryOption {
  return typeof value === "string" && value in EXPIRY_OPTIONS;
}
