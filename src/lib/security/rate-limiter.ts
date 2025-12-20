/**
 * In-memory rate limiter for abuse prevention.
 * Limits requests to RATE_LIMIT per RATE_WINDOW milliseconds per IP.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/** Maximum requests allowed per window */
const RATE_LIMIT = 5;

/** Rate limit window in milliseconds (1 minute) */
const RATE_WINDOW = 60_000;

/** Cleanup interval in milliseconds (5 minutes) */
const CLEANUP_INTERVAL = 300_000;

/** Handle for the cleanup interval, used for teardown */
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Periodically clean up expired entries to prevent memory leaks.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [ip, entry] of Array.from(rateLimitMap.entries())) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

// Set up periodic cleanup (only in non-test environments)
if (typeof setInterval !== "undefined" && process.env.NODE_ENV !== "test") {
  cleanupIntervalId = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);
}

/**
 * Stops the periodic cleanup interval.
 * Useful for tests, hot reloads, or graceful shutdown.
 */
export function stopCleanupInterval(): void {
  if (cleanupIntervalId !== null) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

/**
 * Checks if a request from the given IP is within rate limits.
 *
 * @param ip The IP address to check.
 * @returns true if the request is allowed, false if rate limited.
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // No entry or expired entry - create new
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  // Check if limit exceeded
  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  // Increment count
  entry.count++;
  return true;
}

/**
 * Gets the remaining requests for an IP address.
 * Useful for setting rate limit headers.
 *
 * @param ip The IP address to check.
 * @returns Object with remaining requests and reset time.
 */
export function getRateLimitInfo(ip: string): {
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    return { remaining: RATE_LIMIT, resetTime: now + RATE_WINDOW };
  }

  return {
    remaining: Math.max(0, RATE_LIMIT - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Resets rate limit for an IP (useful for testing).
 *
 * @param ip The IP address to reset.
 */
export function resetRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}
