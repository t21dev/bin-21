import Redis from 'ioredis'

// Redis client (lazy connection)
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.REDIS_URL
  if (!url) return null

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 3000,
    })
    redis.connect().catch(() => {
      redis = null
    })
    return redis
  } catch {
    return null
  }
}

// In-memory fallback when Redis is unavailable
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

async function checkRedisRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  const client = getRedis()
  if (!client) return null

  try {
    const now = Date.now()
    const windowStart = now - windowMs

    // Sliding window using sorted set
    const multi = client.multi()
    multi.zremrangebyscore(key, 0, windowStart)
    multi.zadd(key, now.toString(), `${now}-${Math.random()}`)
    multi.zcard(key)
    multi.pexpire(key, windowMs)

    const results = await multi.exec()
    if (!results) return null

    const count = results[2]?.[1] as number
    const reset = now + windowMs

    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      reset,
    }
  } catch {
    return null // Fall back to in-memory
  }
}

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
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

export function checkRateLimit(
  identifier: string,
  prefix: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const key = `ratelimit:${prefix}:${identifier}`

  // Try Redis first (non-blocking, fall back to memory)
  // For proxy.ts we use sync in-memory since proxy runs on Node.js
  return checkMemoryRateLimit(key, limit, windowMs)
}

// Async version for use in server actions / API routes
export async function checkRateLimitAsync(
  identifier: string,
  prefix: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${prefix}:${identifier}`

  const redisResult = await checkRedisRateLimit(key, limit, windowMs)
  if (redisResult) return redisResult

  return checkMemoryRateLimit(key, limit, windowMs)
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
