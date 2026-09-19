// Simple fixed-window, per-IP rate limiter held in memory.
//
// Caveat: on Vercel each function instance has its own memory, so this is a
// best-effort limit, not a global one. That is fine for a parody app.
//
// ============================================================================
// UPSTASH HOOK
// To make the limit global, swap `checkRateLimit` for @upstash/ratelimit:
//
//   import { Ratelimit } from "@upstash/ratelimit";
//   import { Redis } from "@upstash/redis";
//   const limiter = new Ratelimit({
//     redis: Redis.fromEnv(), // UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//     limiter: Ratelimit.fixedWindow(RATE_LIMIT.max, "60 s"),
//   });
//   const { success, reset } = await limiter.limit(ip);
//
// and make the call site in app/api/classify/route.ts `await` it.
// ============================================================================

export const RATE_LIMIT = { max: 20, windowMs: 60_000 } as const;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSec: number };

export function checkRateLimit(
  key: string,
  now: number = Date.now(),
  { max, windowMs }: { max: number; windowMs: number } = RATE_LIMIT,
): RateLimitResult {
  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count++;

  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return { ok: bucket.count <= max, remaining: Math.max(0, max - bucket.count), retryAfterSec };
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** Test helper. */
export function resetRateLimit() {
  buckets.clear();
}
