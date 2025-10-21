/**
 * Rate Limiting Utilities
 *
 * Implements IP-based and identifier-based rate limiting for API endpoints.
 * Includes both in-memory (for development) and database-backed (for production) strategies.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { config } from './config'

// In-memory rate limiting store (not suitable for production with multiple servers)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a generic identifier
  return 'unknown'
}

/**
 * In-memory rate limiter (for simple cases)
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = `ratelimit:${identifier}`
  const entry = rateLimitStore.get(key)

  // No existing entry or window expired
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: maxAttempts - 1, resetAt }
  }

  // Within window
  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up every 5 minutes
if (typeof window === 'undefined') {
  // Only run on server
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}

/**
 * Database-backed try-on usage tracking
 */
export type TryOnUsageResult = {
  allowed: boolean
  remaining: number
  totalUsed: number
  message?: string
}

/**
 * Check try-on usage limits (database-backed)
 * Supports user-based tiers:
 * - Anonymous (IP): 2 per day
 * - Authenticated without purchase: 2 lifetime
 * - Authenticated with purchase: unlimited
 */
export async function checkTryOnLimit(
  identifier: string,
  identifierType: 'ip' | 'phone' | 'user' = 'ip',
  userId?: string
): Promise<TryOnUsageResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user has purchased (unlimited try-ons)
    if (userId) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('has_purchased')
        .eq('user_id', userId)
        .single()

      if (userProfile?.has_purchased) {
        return {
          allowed: true,
          remaining: 999, // Display as "unlimited"
          totalUsed: 0,
          message: 'Unlimited try-ons (Premium Member)',
        }
      }
    }

    const now = new Date()

    // For authenticated users without purchase: lifetime limit (2 total)
    // For anonymous users: time-based limit (2 per day)
    const isAuthenticatedUser = identifierType === 'user' || userId
    const limit = isAuthenticatedUser ? 2 : config.tryOn.ipLimitPerDay

    let query = supabase
      .from('try_on_usage')
      .select('attempt_count, last_attempt_at')

    if (userId) {
      // Check by user_id for authenticated users
      query = query.eq('user_id', userId)
    } else {
      // Check by identifier (IP) for anonymous users
      query = query.eq('identifier', identifier).eq('identifier_type', identifierType)

      // For IP-based, only check within the time window
      const windowStart = new Date(now.getTime() - config.tryOn.ipLimitWindow)
      query = query.gte('last_attempt_at', windowStart.toISOString())
    }

    const { data: usageRecords, error } = await query.order('last_attempt_at', { ascending: false })

    if (error) {
      console.error('Database error checking try-on limits:', error)
      return {
        allowed: true,
        remaining: limit,
        totalUsed: 0,
        message: 'Unable to verify limit, proceeding',
      }
    }

    // Calculate total attempts
    const totalAttempts = usageRecords.reduce(
      (sum, record) => sum + record.attempt_count,
      0
    )

    const remaining = Math.max(0, limit - totalAttempts)

    if (totalAttempts >= limit) {
      let message: string
      if (isAuthenticatedUser) {
        message = 'Try-on limit reached. Complete a purchase to unlock unlimited try-ons!'
      } else {
        const windowStart = new Date(now.getTime() - config.tryOn.ipLimitWindow)
        const hoursRemaining = Math.ceil(
          (windowStart.getTime() + config.tryOn.ipLimitWindow - now.getTime()) /
            (60 * 60 * 1000)
        )
        message = `Try-on limit reached. Sign in for more, or try again in ${hoursRemaining} hours.`
      }

      return {
        allowed: false,
        remaining: 0,
        totalUsed: totalAttempts,
        message,
      }
    }

    return {
      allowed: true,
      remaining,
      totalUsed: totalAttempts,
    }
  } catch (error) {
    console.error('Error in checkTryOnLimit:', error)
    return {
      allowed: true,
      remaining: config.tryOn.ipLimitPerDay,
      totalUsed: 0,
    }
  }
}

/**
 * Record a try-on attempt in the database
 */
export async function recordTryOnAttempt(
  identifier: string,
  identifierType: 'ip' | 'phone' | 'user' = 'ip',
  productId?: string,
  userId?: string
): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date()

    // Insert new attempt record
    const { error } = await supabase.from('try_on_usage').insert({
      identifier,
      identifier_type: identifierType,
      product_id: productId,
      user_id: userId || null,
      attempt_count: 1,
      last_attempt_at: now.toISOString(),
    })

    if (error) {
      console.error('Error recording try-on attempt:', error)
    }
  } catch (error) {
    console.error('Error in recordTryOnAttempt:', error)
  }
}

/**
 * Get remaining try-on attempts for display
 */
export async function getRemainingTryOns(
  identifier: string,
  identifierType: 'ip' | 'phone' | 'user' = 'ip',
  userId?: string
): Promise<number> {
  const result = await checkTryOnLimit(identifier, identifierType, userId)
  return result.remaining
}
