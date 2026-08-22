import { NextRequest, NextResponse } from "next/server";
import { getRedis, secretKey } from "@/lib/redis";
import { getReadLimiter, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

/**
 * GET /api/secret/[id]
 * Returns the stored ciphertext exactly once, then deletes it. The read and
 * delete happen in a single atomic GETDEL so two concurrent reads can never
 * both succeed. A missing/already-consumed secret returns 404.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { success } = await getReadLimiter().limit(clientIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await ctx.params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Atomic get-and-delete: enforces one-time read server-side.
  const ciphertext = await getRedis().getdel<string>(secretKey(id));

  if (ciphertext === null || ciphertext === undefined) {
    return NextResponse.json({ error: "Secret not found or already read" }, { status: 404 });
  }

  return NextResponse.json(
    { ciphertext },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
