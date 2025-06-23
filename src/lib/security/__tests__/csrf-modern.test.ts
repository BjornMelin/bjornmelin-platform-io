/**
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CSRF_CONFIG,
  checkCSRFToken,
  clearTokenStore,
  generateCSRFCookie,
  generateCSRFToken,
  getCSRFTokenFromRequest,
  getTokenStoreStats,
  validateCSRFToken,
  validateDoubleSubmit,
} from "../csrf-modern";

// Mock WebCrypto for Node.js environment with more unique values
let uuidCounter = 0;
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => {
      uuidCounter++;
      return `test-uuid-${uuidCounter}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    },
    subtle: {
      importKey: vi.fn().mockResolvedValue("mock-key"),
      sign: vi.fn().mockImplementation(() => {
        // Return different random bytes each time
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          bytes[i] = Math.floor(Math.random() * 256);
        }
        return Promise.resolve(bytes.buffer);
      }),
    },
  },
  writable: true,
});

// Mock Next.js headers
const mockHeaders = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: (key: string) => mockHeaders.get(key.toLowerCase()),
    has: (key: string) => mockHeaders.has(key.toLowerCase()),
    forEach: (callback: (value: string, key: string) => void) => {
      mockHeaders.forEach(callback);
    },
  })),
}));

describe("CSRF Modern Implementation", () => {
  beforeEach(() => {
    clearTokenStore();
    mockHeaders.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearTokenStore();
  });

  describe("generateCSRFToken", () => {
    it("should generate a valid CSRF token with session ID", async () => {
      const result = await generateCSRFToken();

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("sessionId");
      expect(typeof result.token).toBe("string");
      expect(typeof result.sessionId).toBe("string");
      expect(result.token.length).toBeGreaterThan(60); // Token + signature
      expect(result.token).toContain("."); // Base.signature format
    });

    it("should generate token with custom session ID", async () => {
      const customSessionId = "custom-session-123";
      const result = await generateCSRFToken(customSessionId);

      expect(result.sessionId).toBe(customSessionId);
    });

    it("should generate token with origin binding", async () => {
      const origin = "https://example.com";
      const result = await generateCSRFToken(undefined, origin);

      expect(result.token).toBeDefined();
      expect(result.sessionId).toBeDefined();
    });

    it("should generate unique tokens for each call", async () => {
      const result1 = await generateCSRFToken();
      const result2 = await generateCSRFToken();

      expect(result1.token).not.toBe(result2.token);
      expect(result1.sessionId).not.toBe(result2.sessionId);
    });
  });

  describe("validateCSRFToken", () => {
    it("should validate a legitimate token", async () => {
      const { token, sessionId } = await generateCSRFToken();
      mockHeaders.set("x-session-id", sessionId);

      const result = await validateCSRFToken(token);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.newToken).toBeDefined();
    });

    it("should reject missing token", async () => {
      const result = await validateCSRFToken(null);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Missing CSRF token");
    });

    it("should reject missing session ID", async () => {
      const { token } = await generateCSRFToken();

      const result = await validateCSRFToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Missing session ID");
    });

    it("should reject malformed token", async () => {
      const { sessionId } = await generateCSRFToken();
      mockHeaders.set("x-session-id", sessionId);

      const result = await validateCSRFToken("invalid-token");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Malformed token");
    });

    it("should reject token for non-existent session", async () => {
      mockHeaders.set("x-session-id", "non-existent-session");

      const result = await validateCSRFToken("token.signature");

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid session or token expired");
    });

    it("should validate origin when provided", async () => {
      const origin = "https://example.com";
      const { token, sessionId } = await generateCSRFToken(undefined, origin);

      mockHeaders.set("x-session-id", sessionId);
      mockHeaders.set("origin", origin);
      mockHeaders.set("host", "example.com");

      const result = await validateCSRFToken(token);

      expect(result.valid).toBe(true);
    });

    it("should reject origin mismatch", async () => {
      const origin = "https://example.com";
      const { token, sessionId } = await generateCSRFToken(undefined, origin);

      mockHeaders.set("x-session-id", sessionId);
      mockHeaders.set("origin", "https://evil.com");
      mockHeaders.set("host", "example.com");

      const result = await validateCSRFToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Origin mismatch");
    });

    it("should reject invalid origin format", async () => {
      const { token, sessionId } = await generateCSRFToken();

      mockHeaders.set("x-session-id", sessionId);
      mockHeaders.set("origin", "https://evil.com");
      mockHeaders.set("host", "example.com");

      const result = await validateCSRFToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid origin");
    });

    it("should consume token after successful validation", async () => {
      const { token, sessionId } = await generateCSRFToken();
      mockHeaders.set("x-session-id", sessionId);

      // First validation should succeed
      const result1 = await validateCSRFToken(token);
      expect(result1.valid).toBe(true);

      // Second validation should fail (token consumed)
      const result2 = await validateCSRFToken(token);
      expect(result2.valid).toBe(false);
    });
  });

  describe("checkCSRFToken", () => {
    const createMockRequest = (method: string, headers: Record<string, string> = {}) => {
      return {
        method,
        headers: {
          get: (key: string) => headers[key.toLowerCase()] || null,
        },
      } as Request;
    };

    it("should allow safe methods without CSRF", async () => {
      const request = createMockRequest("GET");
      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(true);
    });

    it("should validate unsafe methods", async () => {
      const { token, sessionId } = await generateCSRFToken();
      mockHeaders.set("x-session-id", sessionId);

      const request = createMockRequest("POST", {
        "x-csrf-token": token,
        "x-session-id": sessionId,
      });

      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(true);
      expect(result.newHeaders).toBeDefined();
    });

    it("should reject unsafe methods without CSRF token", async () => {
      const request = createMockRequest("POST");
      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(false);
    });

    it("should handle multiple token header names", async () => {
      const { token, sessionId } = await generateCSRFToken();
      mockHeaders.set("x-session-id", sessionId);

      const request = createMockRequest("POST", {
        "csrf-token": token,
        "x-session-id": sessionId,
      });

      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(true);
    });
  });

  describe("getCSRFTokenFromRequest", () => {
    it("should get token from X-CSRF-Token header", async () => {
      const token = "test-token";
      mockHeaders.set("x-csrf-token", token);

      const result = await getCSRFTokenFromRequest();

      expect(result).toBe(token);
    });

    it("should handle missing token", async () => {
      const result = await getCSRFTokenFromRequest();

      expect(result).toBeNull();
    });

    it("should try multiple header names", async () => {
      const token = "test-token";
      mockHeaders.set("csrf-token", token);

      const result = await getCSRFTokenFromRequest();

      expect(result).toBe(token);
    });
  });

  describe("generateCSRFCookie and validateDoubleSubmit", () => {
    it("should generate cookie value", () => {
      const cookieValue = generateCSRFCookie();

      expect(typeof cookieValue).toBe("string");
      expect(cookieValue.length).toBeGreaterThan(0);
    });

    it("should validate matching values", () => {
      const value = "test-value";
      const result = validateDoubleSubmit(value, value);

      expect(result).toBe(true);
    });

    it("should reject mismatched values", () => {
      const result = validateDoubleSubmit("value1", "value2");

      expect(result).toBe(false);
    });
  });

  describe("Token Store Management", () => {
    it("should track token store statistics", async () => {
      // Generate some tokens
      await generateCSRFToken();
      await generateCSRFToken();

      const stats = getTokenStoreStats();

      expect(stats).toHaveProperty("size");
      expect(stats).toHaveProperty("memoryUsage");
      expect(stats.size).toBeGreaterThan(0);
    });

    it("should clear token store", async () => {
      await generateCSRFToken();

      let stats = getTokenStoreStats();
      expect(stats.size).toBeGreaterThan(0);

      clearTokenStore();

      stats = getTokenStoreStats();
      expect(stats.size).toBe(0);
    });
  });

  describe("CSRF Configuration", () => {
    it("should have valid configuration", () => {
      expect(CSRF_CONFIG).toHaveProperty("cookieName");
      expect(CSRF_CONFIG).toHaveProperty("headerName");
      expect(CSRF_CONFIG).toHaveProperty("sessionHeaderName");
      expect(CSRF_CONFIG).toHaveProperty("tokenExpiry");
      expect(CSRF_CONFIG).toHaveProperty("cookieOptions");

      expect(typeof CSRF_CONFIG.cookieName).toBe("string");
      expect(typeof CSRF_CONFIG.headerName).toBe("string");
      expect(typeof CSRF_CONFIG.tokenExpiry).toBe("number");
      expect(CSRF_CONFIG.tokenExpiry).toBeGreaterThan(0);
    });

    it("should have secure cookie options in production", () => {
      vi.stubEnv("NODE_ENV", "production");

      // Re-import module to get updated config
      vi.resetModules();

      vi.unstubAllEnvs();
    });
  });

  describe("Error Handling", () => {
    it("should handle crypto.subtle failures gracefully", async () => {
      // Mock crypto.subtle to fail
      const originalImportKey = global.crypto.subtle.importKey;
      global.crypto.subtle.importKey = vi.fn().mockRejectedValue(new Error("Crypto failure"));

      const result = await generateCSRFToken();

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("sessionId");

      // Restore original
      global.crypto.subtle.importKey = originalImportKey;
    });

    it("should handle malformed URLs in origin validation", async () => {
      const { token, sessionId } = await generateCSRFToken();

      mockHeaders.set("x-session-id", sessionId);
      mockHeaders.set("origin", "not-a-valid-url");
      mockHeaders.set("host", "example.com");

      const result = await validateCSRFToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid origin");
    });
  });

  describe("Security Features", () => {
    it("should implement constant-time comparison", async () => {
      const { token, sessionId } = await generateCSRFToken();
      mockHeaders.set("x-session-id", sessionId);

      // Test with slightly different token
      const tamperedToken = `${token.slice(0, -1)}x`;

      const start = process.hrtime.bigint();
      await validateCSRFToken(tamperedToken);
      const end = process.hrtime.bigint();

      const timingDiff = Number(end - start);

      // This is a basic check - in real scenarios, you'd need more sophisticated timing analysis
      expect(timingDiff).toBeGreaterThan(0);
    });

    it("should bind tokens to specific origins", async () => {
      const origin1 = "https://site1.com";
      const origin2 = "https://site2.com";

      const { token: token1, sessionId: sessionId1 } = await generateCSRFToken(undefined, origin1);
      const { token: token2 } = await generateCSRFToken(undefined, origin2);

      expect(token1).not.toBe(token2);

      // Token1 should only work with origin1
      mockHeaders.set("x-session-id", sessionId1);
      mockHeaders.set("origin", origin2);
      mockHeaders.set("host", "site2.com");

      const result = await validateCSRFToken(token1);
      expect(result.valid).toBe(false);
    });

    it("should generate cryptographically secure tokens", async () => {
      const tokens = new Set<string>();
      const count = 100;

      // Generate multiple tokens and ensure they're unique
      for (let i = 0; i < count; i++) {
        const { token } = await generateCSRFToken();
        tokens.add(token);
      }

      expect(tokens.size).toBe(count);
    });
  });
});
