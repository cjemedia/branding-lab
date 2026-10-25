// Simple per-instance rate limiter. Good enough to slow down repeated
// requests to email-sending endpoints on serverless hosting.
const hits = new Map<string, number[]>()

export function rateLimited(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  recent.push(now)
  hits.set(key, recent)
  return recent.length > limit
}
