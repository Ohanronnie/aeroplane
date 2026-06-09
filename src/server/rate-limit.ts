import type { Context, Next } from "hono";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60_000;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(c: Context, next: Next) {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
    ?? c.req.header("x-real-ip")
    ?? "127.0.0.1";

  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, bucket);
  }

  bucket.count++;
  c.res.headers.set("X-RateLimit-Limit", String(MAX_ATTEMPTS));
  c.res.headers.set("X-RateLimit-Remaining", String(Math.max(0, MAX_ATTEMPTS - bucket.count)));
  c.res.headers.set("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > MAX_ATTEMPTS) {
    return c.json({ error: "Rate limit exceeded. Try again shortly." }, 429);
  }

  return next();
}
