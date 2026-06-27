import type { Context, Next } from "hono";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60_000;
const MAX_BUCKETS = 10_000;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastPruneAt = 0;

function pruneBuckets(now: number) {
  if (now - lastPruneAt < WINDOW_MS && buckets.size < MAX_BUCKETS) return;
  lastPruneAt = now;

  for (const [ip, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(ip);
  }

  if (buckets.size <= MAX_BUCKETS) return;

  const excess = buckets.size - MAX_BUCKETS;
  const oldest = [...buckets.entries()]
    .sort((a, b) => a[1].resetAt - b[1].resetAt)
    .slice(0, excess);

  for (const [ip] of oldest) {
    buckets.delete(ip);
  }
}

function clientIp(c: Context) {
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    const forwardedChain = forwardedFor.split(",").map((part) => part.trim()).filter(Boolean);
    const proxyReportedIp = forwardedChain.at(-1);
    if (proxyReportedIp) return proxyReportedIp;
  }

  return c.req.header("x-real-ip")?.trim() || "unknown";
}

export function rateLimit(c: Context, next: Next) {
  const ip = clientIp(c);
  const now = Date.now();
  pruneBuckets(now);

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
