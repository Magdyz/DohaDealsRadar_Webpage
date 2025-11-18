/**
 * Rate limiting utilities
 * In-memory rate limiting for API endpoints
 * For production, consider using Redis or Vercel KV for distributed rate limiting
 */

import { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory storage for rate limits
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  max: number

  /**
   * Time window in milliseconds
   */
  windowMs: number

  /**
   * Custom message when rate limit is exceeded
   */
  message?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * Get client identifier from request (IP address or user ID)
 */
function getClientIdentifier(request: NextRequest, prefix: string): string {
  // Try to get IP address from headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  // Use the first IP from x-forwarded-for, or x-real-ip, or default to 'unknown'
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown'

  return `${prefix}:${ip}`
}

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): RateLimitResult {
  // Skip rate limiting in development if env variable is set
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return {
      success: true,
      limit: config.max,
      remaining: config.max,
      resetAt: Date.now() + config.windowMs,
    }
  }

  const key = identifier || getClientIdentifier(request, 'default')
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)

    return {
      success: true,
      limit: config.max,
      remaining: config.max - 1,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  if (entry.count > config.max) {
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  return {
    success: true,
    limit: config.max,
    remaining: config.max - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Login OTP requests: 5 requests per 15 minutes per IP
export const loginRateLimit: RateLimitConfig = {
  max: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many login attempts. Please try again in 15 minutes.',
}

// Deal submission: 10 deals per day per user
export const dealSubmitLimit: RateLimitConfig = {
  max: 10,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  message: 'Maximum deal submissions reached for today. Please try again tomorrow.',
}

// Image upload: 20 uploads per hour per IP
export const imageUploadLimit: RateLimitConfig = {
  max: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many image uploads. Please try again later.',
}

// Vote casting: 100 votes per hour per device (generous limit)
export const voteLimit: RateLimitConfig = {
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many votes. Please slow down.',
}

// Report submission: 10 reports per day per device
export const reportLimit: RateLimitConfig = {
  max: 10,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  message: 'Maximum reports reached for today.',
}

// General API: 1000 requests per 15 minutes per IP (very generous)
export const generalApiLimit: RateLimitConfig = {
  max: 1000,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests. Please slow down.',
}
