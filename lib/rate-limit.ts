// In-memory rate limiting.
//
// This is the only store we need: the SQLite database lives on a Railway volume,
// and Railway forbids replicas on a service with a volume, so there is exactly
// one process. A shared store (Redis) would buy nothing.
//
// Trade-off: counters reset on deploy/restart. Acceptable for abuse throttling.

interface RateLimitRecord {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, RateLimitRecord>()

// Cleanup memory store periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of memoryStore) {
      if (now > record.resetAt) {
        memoryStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export function checkRateLimit(
  identifier: string,
  prefix: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const key = `ratelimit:${prefix}:${identifier}`
  const now = Date.now()
  const record = memoryStore.get(key)

  if (!record || now > record.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs }
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.resetAt }
  }

  record.count++
  return { success: true, limit, remaining: limit - record.count, reset: record.resetAt }
}

export const RATE_LIMITS = {
  create: { limit: 10, windowMs: 60 * 1000 },
  view: { limit: 60, windowMs: 60 * 1000 },
  password: { limit: 5, windowMs: 5 * 60 * 1000 },
} as const

export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIP = headers.get('x-real-ip')
  if (realIP) return realIP

  return '127.0.0.1'
}
