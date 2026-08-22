import { NextRequest, NextResponse } from "next/server";
import { getRedis, secretKey, EXPIRY_OPTIONS, isExpiryOption } from "@/lib/redis";
import { getCreateLimiter, clientIp } from "@/lib/ratelimit";
import { newSecretId } from "@/lib/id";

export const runtime = "nodejs";

// Reject absurdly large payloads before they hit Redis (~1MB of ciphertext).
const MAX_CIPHERTEXT_LENGTH = 1_000_000;

interface CreateBody {
  ciphertext?: unknown;
  expiry?: unknown;
}

/**
 * POST /api/secret
 * Body: { ciphertext: string (base64url), expiry: "5m" | "1h" | "1d" | "7d" }
 * Stores the opaque ciphertext with a matching TTL and returns { id }.
 * The server never sees the key or plaintext.
 */
export async function POST(req: NextRequest) {
  const { success } = await getCreateLimiter().limit(clientIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ciphertext, expiry } = body;

  if (typeof ciphertext !== "string" || ciphertext.length === 0) {
    return NextResponse.json({ error: "Missing ciphertext" }, { status: 400 });
  }
  if (ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
    return NextResponse.json({ error: "Secret too large" }, { status: 413 });
  }
  if (!isExpiryOption(expiry)) {
    return NextResponse.json({ error: "Invalid expiry" }, { status: 400 });
  }

  const id = newSecretId();
  const ttl = EXPIRY_OPTIONS[expiry];

  await getRedis().set(secretKey(id), ciphertext, { ex: ttl });

  return NextResponse.json({ id }, { status: 201 });
}
