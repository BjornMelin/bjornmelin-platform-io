import { randomBytes } from "crypto";
import { headers } from "next/headers";

/**
 * CSRF Protection Module
 * Simple implementation suitable for a portfolio site
 */

// In-memory token store (for portfolio-scale application)
// In production, consider Redis or database storage
const tokenStore = new Map<string, { token: string; expires: number }>();

// Token expiry time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000;

// Clean up expired tokens periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of tokenStore.entries()) {
      if (value.expires < now) {
        tokenStore.delete(key);
      }
    }
  },
  10 * 60 * 1000,
); // Run every 10 minutes

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  const token = randomBytes(32).toString("hex");
  const sessionId = generateSessionId();

  tokenStore.set(sessionId, {
    token,
    expires: Date.now() + TOKEN_EXPIRY,
  });

  return token;
}

/**
 * Validate a CSRF token
 */
export async function validateCSRFToken(token: string | null): Promise<boolean> {
  if (!token) return false;

  const headersList = await headers();
  const sessionId = getSessionId(headersList);

  if (!sessionId) return false;

  const storedData = tokenStore.get(sessionId);

  if (!storedData) return false;

  // Check if token has expired
  if (storedData.expires < Date.now()) {
    tokenStore.delete(sessionId);
    return false;
  }

  // Validate token
  const isValid = storedData.token === token;

  // Delete token after use (one-time use)
  if (isValid) {
    tokenStore.delete(sessionId);
  }

  return isValid;
}

/**
 * Get CSRF token from request headers
 */
export async function getCSRFTokenFromRequest(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get("x-csrf-token");
}

/**
 * Generate a session ID based on IP and user agent
 * For a portfolio site, this simple approach is sufficient
 */
function generateSessionId(): string {
  // In a real application, you'd use proper session management
  // For this portfolio, we'll use a simple approach
  const timestamp = Date.now();
  const random = randomBytes(16).toString("hex");
  return `${timestamp}-${random}`;
}

/**
 * Get session ID from headers
 */
function getSessionId(headersList: Headers): string | null {
  // In a real application, you'd get this from a session cookie
  // For this portfolio, we'll use a simple header-based approach
  return headersList.get("x-session-id");
}

/**
 * Middleware to check CSRF token
 */
export async function checkCSRFToken(
  request: Request,
): Promise<{ valid: boolean; error?: string }> {
  // Skip CSRF check for GET requests
  if (request.method === "GET") {
    return { valid: true };
  }

  const token = request.headers.get("x-csrf-token");
  const isValid = await validateCSRFToken(token);

  if (!isValid) {
    return {
      valid: false,
      error: "Invalid or missing CSRF token",
    };
  }

  return { valid: true };
}
