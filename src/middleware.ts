/**
 * Modern Next.js 15 Middleware with Custom CSRF Protection
 * Replaces @edge-csrf/nextjs with enhanced security implementation
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  CSRF_CONFIG,
  checkCSRFToken,
  generateCSRFCookie,
  generateCSRFToken,
} from "@/lib/security/csrf-modern";

// Security headers for all responses
const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Prevent XSS attacks
  "X-XSS-Protection": "1; mode=block",
  // Force HTTPS in production
  ...(process.env.NODE_ENV === "production" && {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  }),
} as const;

// Paths that should be excluded from CSRF protection
const EXCLUDED_PATHS = [
  "/api/health",
  "/api/metrics",
  "/api/csrf-modern", // CSRF token generation endpoint
  "/_next/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

// Safe HTTP methods that don't require CSRF protection
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

/**
 * Check if path should be excluded from CSRF protection
 */
function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATHS.some((excluded) => pathname.startsWith(excluded));
}

/**
 * Check if request is from same origin
 */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.hostname === host;
  } catch {
    return false;
  }
}

/**
 * Handle CSRF token generation for GET requests
 */
async function handleTokenGeneration(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next();

  // Only generate tokens for same-origin requests
  if (!isSameOrigin(request)) {
    return response;
  }

  try {
    const origin =
      request.headers.get("origin") || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const { token, sessionId } = await generateCSRFToken(undefined, origin);

    // Set CSRF cookie for double-submit pattern
    const cookieValue = generateCSRFCookie();

    response.cookies.set(CSRF_CONFIG.cookieName, cookieValue, CSRF_CONFIG.cookieOptions);

    // Add token to response headers for client access
    response.headers.set("X-CSRF-Token", token);
    response.headers.set("X-Session-ID", sessionId);
  } catch (error) {
    console.error("CSRF token generation failed:", error);
    // Continue with request even if token generation fails
  }

  return response;
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Create response with security headers
  const response = NextResponse.next();

  // Apply security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Skip middleware for static assets and excluded paths
  if (isExcludedPath(pathname)) {
    return response;
  }

  // Skip CSRF for Server Actions (protected by Next.js built-in mechanisms)
  if (!pathname.startsWith("/api/")) {
    // For non-API routes, optionally generate CSRF tokens for GET requests
    if (method === "GET") {
      return handleTokenGeneration(request);
    }
    return response;
  }

  // Apply CSRF protection to API routes
  try {
    // Skip CSRF for safe methods
    if (SAFE_METHODS.includes(method)) {
      return handleTokenGeneration(request);
    }

    // Check CSRF token for unsafe methods
    const csrfResult = await checkCSRFToken(request);

    if (!csrfResult.valid) {
      console.warn("CSRF validation failed:", {
        path: pathname,
        method,
        error: csrfResult.error,
        origin: request.headers.get("origin"),
        userAgent: request.headers.get("user-agent")?.substring(0, 100),
      });

      return new NextResponse(
        JSON.stringify({
          error: "CSRF validation failed",
          code: "CSRF_TOKEN_INVALID",
          message: csrfResult.error || "Invalid or missing CSRF token",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            ...SECURITY_HEADERS,
          },
        },
      );
    }

    // CSRF validation passed - add new token to response if available
    if (csrfResult.newHeaders) {
      Object.entries(csrfResult.newHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch (error) {
    console.error("CSRF middleware error:", error);

    return new NextResponse(
      JSON.stringify({
        error: "Security validation failed",
        code: "SECURITY_ERROR",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...SECURITY_HEADERS,
        },
      },
    );
  }
}

/**
 * Middleware configuration
 * Matches all routes except static files and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml (metadata files)
     * - Static assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    "/api/:path*",
  ],
};
