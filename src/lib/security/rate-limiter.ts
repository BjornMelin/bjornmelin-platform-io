/**
 * Simple in-memory rate limiter for portfolio site
 * Suitable for low-traffic applications (~10 requests/month)
 */

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

// Store rate limit data by IP address
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const WINDOW_SIZE_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5; // 5 requests per 15 minutes
const CLEANUP_INTERVAL = 30 * 60 * 1000; // Clean up every 30 minutes

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.lastRequest > WINDOW_SIZE_MS) {
      rateLimitStore.delete(ip);
    }
  }
}, CLEANUP_INTERVAL);

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Check if a request is rate limited
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    // First request from this identifier
    rateLimitStore.set(identifier, {
      count: 1,
      firstRequest: now,
      lastRequest: now,
    });

    return {
      allowed: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      reset: now + WINDOW_SIZE_MS,
    };
  }

  // Check if window has expired
  if (now - entry.firstRequest > WINDOW_SIZE_MS) {
    // Reset the window
    rateLimitStore.set(identifier, {
      count: 1,
      firstRequest: now,
      lastRequest: now,
    });

    return {
      allowed: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      reset: now + WINDOW_SIZE_MS,
    };
  }

  // Within the window
  if (entry.count >= MAX_REQUESTS) {
    // Rate limit exceeded
    const resetTime = entry.firstRequest + WINDOW_SIZE_MS;
    return {
      allowed: false,
      limit: MAX_REQUESTS,
      remaining: 0,
      reset: resetTime,
      retryAfter: Math.ceil((resetTime - now) / 1000),
    };
  }

  // Increment count
  entry.count++;
  entry.lastRequest = now;

  return {
    allowed: true,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - entry.count,
    reset: entry.firstRequest + WINDOW_SIZE_MS,
  };
}

/**
 * Get client IP address from request headers
 * Handles various proxy configurations
 */
export function getClientIP(request: Request): string {
  // Check various headers that might contain the real IP
  const headers = request.headers;

  // Common headers set by proxies and load balancers
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Cloudflare
  const cfConnectingIP = headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default identifier
  // In a real production app, you'd have better IP detection
  return `unknown-${Date.now()}`;
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(request: Request): RateLimitResult {
  const clientIP = getClientIP(request);
  return checkRateLimit(clientIP);
}

/**
 * Format rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.reset).toISOString(),
  };

  if (result.retryAfter !== undefined) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create a rate limit error response
 */
export function createRateLimitResponse(): Response {
  const result = {
    allowed: false,
    limit: MAX_REQUESTS,
    remaining: 0,
    reset: Date.now() + WINDOW_SIZE_MS,
    retryAfter: Math.ceil(WINDOW_SIZE_MS / 1000),
  };

  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: `Rate limit exceeded. Please wait ${result.retryAfter} seconds before trying again.`,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...getRateLimitHeaders(result),
      },
    },
  );
}
