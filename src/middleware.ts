import { createCsrfMiddleware } from "@edge-csrf/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Initialize CSRF protection
const csrfProtect = createCsrfMiddleware({
  cookie: {
    name: "_csrf",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
  // Skip CSRF for these paths
  ignoreMethods: ["GET", "HEAD", "OPTIONS"],
  // Additional security headers
  excludePathPrefixes: ["/_next/", "/api/health", "/api/metrics"],
});

export async function middleware(request: NextRequest) {
  // Skip CSRF for Server Actions (already protected by Next.js)
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Apply CSRF protection to API routes
  try {
    return await csrfProtect(request);
  } catch (err) {
    console.error("CSRF middleware error:", err);
    return new NextResponse("Invalid CSRF token", { status: 403 });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt (metadata files)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp|woff|woff2)$).*)",
  ],
};
