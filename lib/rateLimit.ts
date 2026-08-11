/**
 * Simple in-memory rate limiter for API routes.
 * Each limiter instance tracks requests by IP within a sliding window.
 */

interface RateLimitRecord {
  count: number
  timestamp: number
}

export function createRateLimiter(windowMs: number, maxRequests: number) {
  const store = new Map<string, RateLimitRecord>()

  // Periodic cleanup to prevent memory leaks (every 5 minutes)
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of store) {
      if (now - record.timestamp > windowMs) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000).unref?.()

  return {
    /**
     * Check if the request is within rate limits.
     * Returns { allowed: true } or { allowed: false, retryAfterMs }.
     */
    check(ip: string): { allowed: boolean; retryAfterMs?: number } {
      const now = Date.now()
      const record = store.get(ip)

      if (record) {
        if (now - record.timestamp < windowMs) {
          if (record.count >= maxRequests) {
            return { allowed: false, retryAfterMs: windowMs - (now - record.timestamp) }
          }
          record.count++
          return { allowed: true }
        } else {
          // Window expired, reset
          store.set(ip, { count: 1, timestamp: now })
          return { allowed: true }
        }
      }

      store.set(ip, { count: 1, timestamp: now })
      return { allowed: true }
    }
  }
}

/** Extract IP from request headers */
export function getIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}
