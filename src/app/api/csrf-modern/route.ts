/**
 * Modern CSRF Token Generation API
 * Provides enhanced CSRF tokens with improved security features
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  CSRF_CONFIG,
  generateCSRFCookie,
  generateCSRFToken,
  getTokenStoreStats,
} from "@/lib/security/csrf-modern";

export const dynamic = "force-dynamic";

/**
 * Generate CSRF token
 */
export async function GET(request: NextRequest) {
  try {
    // Get origin for enhanced validation
    const origin =
      request.headers.get("origin") || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // Validate same-origin request
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.hostname !== host) {
          return NextResponse.json({ error: "Cross-origin requests not allowed" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid origin header" }, { status: 400 });
      }
    }

    // Generate CSRF token and session
    const { token, sessionId } = await generateCSRFToken(undefined, origin);

    // Generate cookie value for double-submit pattern
    const cookieValue = generateCSRFCookie();

    // Create response with token data
    const response = NextResponse.json(
      {
        token,
        sessionId,
        expiresIn: Math.floor(CSRF_CONFIG.tokenExpiry / 1000), // seconds
        algorithm: "HMAC-SHA256",
        version: "2.0",
        issued: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "X-Session-ID": sessionId,
          "X-CSRF-Version": "2.0",
        },
      },
    );

    // Set secure CSRF cookie
    response.cookies.set(CSRF_CONFIG.cookieName, cookieValue, CSRF_CONFIG.cookieOptions);

    return response;
  } catch (error) {
    console.error("CSRF token generation error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate CSRF token",
        code: "CSRF_GENERATION_FAILED",
      },
      { status: 500 },
    );
  }
}

/**
 * Validate CSRF token (for testing/debugging)
 * POST endpoint to validate existing tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, sessionId } = body;

    if (!token || !sessionId) {
      return NextResponse.json(
        {
          valid: false,
          error: "Missing token or sessionId",
        },
        { status: 400 },
      );
    }

    // Import validation function dynamically to avoid circular imports
    const { validateCSRFToken } = await import("@/lib/security/csrf-modern");
    const result = await validateCSRFToken(token, sessionId);

    return NextResponse.json({
      valid: result.valid,
      error: result.error,
      newToken: result.newToken,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("CSRF validation error:", error);

    return NextResponse.json(
      {
        valid: false,
        error: "Validation failed",
        code: "CSRF_VALIDATION_ERROR",
      },
      { status: 500 },
    );
  }
}

/**
 * Get CSRF statistics (for monitoring)
 * Only available in development
 */
export async function OPTIONS() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const stats = getTokenStoreStats();

    return NextResponse.json({
      ...stats,
      config: {
        tokenExpiry: CSRF_CONFIG.tokenExpiry,
        cookieName: CSRF_CONFIG.cookieName,
        headerName: CSRF_CONFIG.headerName,
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("CSRF stats error:", error);

    return NextResponse.json({ error: "Failed to get statistics" }, { status: 500 });
  }
}
