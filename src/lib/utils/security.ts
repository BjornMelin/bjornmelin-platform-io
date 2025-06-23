import crypto from "node:crypto";
import { headers } from "next/headers";

// Generate CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("base64");
}

// Validate CSRF token (alias for verifyCSRFToken)
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
  } catch {
    return false;
  }
}

// Get CSRF token from headers (for server components)
export async function getCSRFToken(): Promise<string | null> {
  const h = await headers();
  return h.get("X-CSRF-Token");
}

// Validate CSRF token from request
export async function validateCSRFFromHeaders(request: Request): Promise<boolean> {
  const token = request.headers.get("X-CSRF-Token");
  const cookieHeader = request.headers.get("Cookie");

  if (!token || !cookieHeader) return false;

  // Extract CSRF cookie value
  const csrfCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("_csrf="))
    ?.trim()
    .split("=")[1];

  if (!csrfCookie) return false;

  return validateCSRFToken(token, csrfCookie);
}

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Default rate limit: 5 submissions per 15 minutes per IP
export const defaultContactFormRateLimit: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
};

// Simple in-memory rate limiter (for demonstration - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Export rate limit store for testing
export const rateLimit = {
  store: rateLimitStore,
  clear: () => rateLimitStore.clear(),
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultContactFormRateLimit,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  const maxRequests = config.maxRequests;

  if (!record || record.resetTime < now) {
    // New window or expired window
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

// Clean up expired rate limit entries
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitStore.forEach((value, key) => {
    if (value.resetTime < now) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimitStore.delete(key));
}

// Run cleanup every 5 minutes
if (typeof window === "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";

  // Remove HTML tags but preserve text content
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags and content
    .replace(/<[^>]+>/g, "") // Remove all HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
}

// Get client IP address
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (cfConnectingIp) return cfConnectingIp;
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return ip;
  }
  if (realIp?.trim()) return realIp.trim();

  // Fallback to a default identifier if no IP is found
  return "unknown";
}
