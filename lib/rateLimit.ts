/**
 * Distributed rate limiter backed by Upstash Redis / Vercel KV REST API.
 * Falls back to an in-memory fixed/sliding window store only when
 * UPSTASH_REDIS_REST_URL / KV_REST_API_URL is unset (e.g. local dev).
 */

interface RateLimitRecord {
  count: number
  timestamp: number
}

export type RateLimitResult = {
  allowed: boolean
  retryAfterMs?: number
  backend: 'redis' | 'memory'
}

function getRedisConfig(): { url: string; token: string } | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)?.trim()
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)?.trim()
  if (!url || !token) return null
  return { url: url.replace(/\/+$/, ''), token }
}

async function checkRedisWindow(
  url: string,
  token: string,
  redisKey: string,
  windowMs: number,
  maxRequests: number,
): Promise<RateLimitResult> {
  const commands = [
    ['INCR', redisKey],
    ['PEXPIRE', redisKey, String(windowMs), 'NX'],
    ['PTTL', redisKey],
  ]

  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
    cache: 'no-store',
    signal: AbortSignal.timeout(3000),
  })

  if (!res.ok) {
    throw new Error(`Redis pipeline HTTP ${res.status}`)
  }

  const results = (await res.json()) as Array<{ result?: number | string; error?: string }>
  const count = Number(results?.[0]?.result ?? 0)
  const pttl = Number(results?.[2]?.result ?? windowMs)

  if (!Number.isFinite(count) || count <= 0) {
    throw new Error('Invalid Redis INCR response')
  }

  if (count > maxRequests) {
    return {
      allowed: false,
      retryAfterMs: pttl > 0 ? pttl : windowMs,
      backend: 'redis',
    }
  }

  return { allowed: true, backend: 'redis' }
}

export function createRateLimiter(windowMs: number, maxRequests: number, namespace = 'default') {
  const store = new Map<string, RateLimitRecord>()

  // Periodic cleanup to prevent memory leaks when running in local in-memory mode
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of store) {
      if (now - record.timestamp > windowMs) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000).unref?.()

  function checkMemory(key: string): RateLimitResult {
    const now = Date.now()
    const record = store.get(key)

    if (record) {
      if (now - record.timestamp < windowMs) {
        if (record.count >= maxRequests) {
          return { allowed: false, retryAfterMs: windowMs - (now - record.timestamp), backend: 'memory' }
        }
        record.count++
        return { allowed: true, backend: 'memory' }
      }
    }

    store.set(key, { count: 1, timestamp: now })
    return { allowed: true, backend: 'memory' }
  }

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const redis = getRedisConfig()
      if (redis) {
        const bucket = Math.floor(Date.now() / windowMs)
        const redisKey = `runclub:rl:${namespace}:${windowMs}:${bucket}:${identifier}`
        try {
          return await checkRedisWindow(redis.url, redis.token, redisKey, windowMs, maxRequests)
        } catch (err: any) {
          console.warn('[RateLimit] Redis backend unavailable, falling back to memory:', {
            namespace,
            message: err?.message || String(err),
          })
        }
      }
      return checkMemory(identifier)
    },
  }
}

/** Extract client IP from x-forwarded-for (or x-real-ip fallback) */
export function getIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}
