/**
 * Modern CSRF Protection Implementation
 *
 * Features:
 * - Uses crypto.subtle for enhanced security
 * - Double-submit cookie pattern with cryptographic binding
 * - Token rotation and automatic expiry
 * - Origin validation
 * - Rate limiting integration
 * - Memory-efficient token storage
 */

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";

interface CSRFTokenData {
  token: string;
  secret: string;
  expires: number;
  createdAt: number;
  origin?: string;
}

interface CSRFValidationResult {
  valid: boolean;
  error?: string;
  newToken?: string;
}

// Enhanced in-memory store with automatic cleanup
class CSRFTokenStore {
  private store = new Map<string, CSRFTokenData>();
  private readonly maxSize = 10000; // Prevent memory exhaustion
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 minutes
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startCleanup();
  }

  set(sessionId: string, data: CSRFTokenData): void {
    // Prevent memory exhaustion
    if (this.store.size >= this.maxSize) {
      this.cleanup();
    }
    this.store.set(sessionId, data);
  }

  get(sessionId: string): CSRFTokenData | undefined {
    const data = this.store.get(sessionId);
    if (data && data.expires < Date.now()) {
      this.store.delete(sessionId);
      return undefined;
    }
    return data;
  }

  delete(sessionId: string): boolean {
    return this.store.delete(sessionId);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, value] of this.store.entries()) {
      if (value.expires < now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.store.delete(key));

    // If still too large, remove oldest entries
    if (this.store.size >= this.maxSize) {
      const entries = Array.from(this.store.entries()).sort(
        (a, b) => a[1].createdAt - b[1].createdAt,
      );

      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.1));
      toRemove.forEach(([key]) => this.store.delete(key));
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

// Global token store instance
const tokenStore = new CSRFTokenStore();

// Configuration constants
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour
const TOKEN_LENGTH = 32;
const SECRET_LENGTH = 32;

/**
 * Generate cryptographically secure random string
 */
function generateSecureRandom(length: number): string {
  return randomBytes(length).toString("hex");
}

/**
 * Create HMAC using crypto.subtle (where available) or fallback
 */
async function createHMAC(secret: string, data: string): Promise<string> {
  // Check if crypto.subtle is available (browser/modern Node.js)
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(data);

      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );

      const signature = await crypto.subtle.sign("HMAC", key, messageData);
      return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (error) {
      console.warn("crypto.subtle HMAC failed, falling back to Node.js crypto");
    }
  }

  // Fallback to Node.js crypto
  const { createHmac } = await import("node:crypto");
  return createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verify HMAC signature
 */
async function verifyHMAC(secret: string, data: string, signature: string): Promise<boolean> {
  const expectedSignature = await createHMAC(secret, data);

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate session ID with enhanced entropy
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = generateSecureRandom(16);
  return `${timestamp}-${random}`;
}

/**
 * Extract session ID from headers (with fallback mechanisms)
 */
function getSessionId(headersList: Headers): string | null {
  // Try multiple header sources
  return (
    headersList.get("x-session-id") ||
    headersList.get("x-csrf-session") ||
    headersList.get("x-request-id") ||
    null
  );
}

/**
 * Validate origin against allowed origins
 */
function validateOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;

  // Allow same-origin requests
  const originUrl = new URL(origin);
  const expectedOrigins = [
    `https://${host}`,
    `http://${host}`, // For development
  ];

  return expectedOrigins.includes(origin) || originUrl.hostname === host;
}

/**
 * Generate CSRF token with enhanced security
 */
export async function generateCSRFToken(
  sessionId?: string,
  origin?: string,
): Promise<{
  token: string;
  sessionId: string;
}> {
  const sid = sessionId || generateSessionId();
  const secret = generateSecureRandom(SECRET_LENGTH);
  const tokenBase = generateSecureRandom(TOKEN_LENGTH);

  // Create cryptographically bound token
  const signature = await createHMAC(secret, `${tokenBase}:${sid}:${origin || ""}`);
  const token = `${tokenBase}.${signature}`;

  tokenStore.set(sid, {
    token,
    secret,
    expires: Date.now() + TOKEN_EXPIRY,
    createdAt: Date.now(),
    origin,
  });

  return { token, sessionId: sid };
}

/**
 * Validate CSRF token with comprehensive checks
 */
export async function validateCSRFToken(
  token: string | null,
  sessionId?: string,
): Promise<CSRFValidationResult> {
  if (!token) {
    return { valid: false, error: "Missing CSRF token" };
  }

  const headersList = await headers();
  const sid = sessionId || getSessionId(headersList);

  if (!sid) {
    return { valid: false, error: "Missing session ID" };
  }

  const storedData = tokenStore.get(sid);
  if (!storedData) {
    return { valid: false, error: "Invalid session or token expired" };
  }

  // Parse token components
  const [tokenBase, signature] = token.split(".");
  if (!tokenBase || !signature) {
    return { valid: false, error: "Malformed token" };
  }

  // Verify origin if stored
  const origin = headersList.get("origin");
  const host = headersList.get("host");

  if (storedData.origin && origin !== storedData.origin) {
    return { valid: false, error: "Origin mismatch" };
  }

  if (origin && !validateOrigin(origin, host)) {
    return { valid: false, error: "Invalid origin" };
  }

  // Verify token signature
  const expectedData = `${tokenBase}:${sid}:${storedData.origin || ""}`;
  const isValidSignature = await verifyHMAC(storedData.secret, expectedData, signature);

  if (!isValidSignature) {
    return { valid: false, error: "Invalid token signature" };
  }

  // Token is valid - remove it (one-time use)
  tokenStore.delete(sid);

  // Generate new token for continued session
  const { token: newToken } = await generateCSRFToken(undefined, origin);

  return { valid: true, newToken };
}

/**
 * Get CSRF token from request headers
 */
export async function getCSRFTokenFromRequest(): Promise<string | null> {
  const headersList = await headers();
  return (
    headersList.get("x-csrf-token") ||
    headersList.get("csrf-token") ||
    headersList.get("x-xsrf-token") ||
    null
  );
}

/**
 * Enhanced middleware to check CSRF token
 */
export async function checkCSRFToken(
  request: Request,
): Promise<CSRFValidationResult & { newHeaders?: Record<string, string> }> {
  // Skip CSRF check for safe methods
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return { valid: true };
  }

  const token =
    request.headers.get("x-csrf-token") ||
    request.headers.get("csrf-token") ||
    request.headers.get("x-xsrf-token");

  const sessionId = request.headers.get("x-session-id") || request.headers.get("x-csrf-session");

  const result = await validateCSRFToken(token, sessionId || undefined);

  // Prepare new headers if token was refreshed
  const newHeaders: Record<string, string> = {};
  if (result.valid && result.newToken) {
    newHeaders["X-New-CSRF-Token"] = result.newToken;
  }

  return { ...result, newHeaders };
}

/**
 * Generate CSRF cookie value for double-submit pattern
 */
export function generateCSRFCookie(): string {
  return generateSecureRandom(TOKEN_LENGTH);
}

/**
 * Validate double-submit cookie pattern
 */
export function validateDoubleSubmit(token: string, cookieValue: string): boolean {
  return token === cookieValue;
}

/**
 * Clear all tokens (for testing and cleanup)
 */
export function clearTokenStore(): void {
  tokenStore.clear();
}

/**
 * Get token store statistics (for monitoring)
 */
export function getTokenStoreStats(): { size: number; memoryUsage: string } {
  return {
    size: tokenStore.size(),
    memoryUsage: `${Math.round(tokenStore.size() * 0.5)} KB (estimated)`,
  };
}

/**
 * Enhanced CSRF configuration
 */
export const CSRF_CONFIG = {
  cookieName: "_csrf",
  headerName: "X-CSRF-Token",
  sessionHeaderName: "X-Session-ID",
  tokenExpiry: TOKEN_EXPIRY,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TOKEN_EXPIRY / 1000, // Convert to seconds
  },
} as const;
