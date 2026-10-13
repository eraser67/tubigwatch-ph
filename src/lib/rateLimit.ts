import { headers } from 'next/headers'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory sliding window store keyed by identifier (IP / user) and action bucket
const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up expired entries every 10 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 10 * 60 * 1000)
}

/**
 * Check if a request exceeds rate limits.
 * @param action - unique action name (e.g. 'submit_store', 'submit_price', 'submit_report')
 * @param limit - maximum allowed requests within the window
 * @param windowMs - time window in milliseconds (default: 15 minutes)
 * @param customIdentifier - optional custom user identifier (falls back to client IP)
 */
export async function checkRateLimit(
  action: string,
  limit: number,
  windowMs: number = 15 * 60 * 1000,
  customIdentifier?: string | null,
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  let identifier = customIdentifier

  if (!identifier) {
    try {
      const headerList = await headers()
      const forwardedFor = headerList.get('x-forwarded-for')
      const realIp = headerList.get('x-real-ip')
      identifier = forwardedFor?.split(',')[0]?.trim() || realIp || 'anonymous_client'
    } catch {
      identifier = 'anonymous_client'
    }
  }

  const key = `${action}:${identifier}`
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  if (record.count >= limit) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  record.count += 1
  return { allowed: true, remaining: limit - record.count, retryAfterSeconds: 0 }
}
