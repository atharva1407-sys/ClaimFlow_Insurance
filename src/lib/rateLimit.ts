// Small in-memory sliding-window limiter. Good enough for a single Node process;
// replace with a shared store (Redis) before running more than one instance.

const buckets = new Map<string, number[]>();

export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);
  return false;
}

export function clientIp(req: { headers: Headers }): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}
