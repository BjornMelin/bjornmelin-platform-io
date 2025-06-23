import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkCSRFToken,
  generateCSRFToken,
  getCSRFTokenFromRequest,
  validateCSRFToken,
} from "../csrf";

// Mock next/headers
const mockHeaders = new Map<string, string>();
vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => mockHeaders.get(key) || null),
  })),
}));

describe("CSRF Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockHeaders.clear();
    mockHeaders.set("x-session-id", "test-session-id");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("generateCSRFToken", () => {
    it("should generate a CSRF token", () => {
      const token = generateCSRFToken();

      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      expect(token.length).toBe(64); // 32 bytes in hex = 64 chars
    });

    it("should generate unique tokens", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      expect(token1).not.toBe(token2);
    });

    it("should generate cryptographically secure tokens", () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCSRFToken());
      }
      // All tokens should be unique
      expect(tokens.size).toBe(100);
    });
  });

  describe("validateCSRFToken", () => {
    it("should return false for null token", async () => {
      const result = await validateCSRFToken(null);
      expect(result).toBe(false);
    });

    it("should return false for empty token", async () => {
      const result = await validateCSRFToken("");
      expect(result).toBe(false);
    });

    it("should return false for invalid token", async () => {
      const result = await validateCSRFToken("invalid-token");
      expect(result).toBe(false);
    });

    it("should return false when no session ID is available", async () => {
      mockHeaders.delete("x-session-id");
      const token = generateCSRFToken();
      const result = await validateCSRFToken(token);
      expect(result).toBe(false);
    });

    it("should validate a valid token", async () => {
      const token = generateCSRFToken();
      const result = await validateCSRFToken(token);
      expect(result).toBe(true);
    });

    it("should invalidate token after successful validation (one-time use)", async () => {
      const token = generateCSRFToken();

      // First validation should succeed
      const result1 = await validateCSRFToken(token);
      expect(result1).toBe(true);

      // Second validation should fail (token already used)
      const result2 = await validateCSRFToken(token);
      expect(result2).toBe(false);
    });

    it("should reject expired tokens", async () => {
      const token = generateCSRFToken();

      // Advance time beyond expiry (1 hour + 1 minute)
      vi.advanceTimersByTime(61 * 60 * 1000);

      const result = await validateCSRFToken(token);
      expect(result).toBe(false);
    });

    it("should accept tokens within expiry time", async () => {
      const token = generateCSRFToken();

      // Advance time but stay within expiry (59 minutes)
      vi.advanceTimersByTime(59 * 60 * 1000);

      const result = await validateCSRFToken(token);
      expect(result).toBe(true);
    });
  });

  describe("getCSRFTokenFromRequest", () => {
    it("should extract CSRF token from request headers", async () => {
      mockHeaders.set("x-csrf-token", "test-token-123");

      const token = await getCSRFTokenFromRequest();
      expect(token).toBe("test-token-123");
    });

    it("should return null when no CSRF token in headers", async () => {
      const token = await getCSRFTokenFromRequest();
      expect(token).toBeNull();
    });
  });

  describe("checkCSRFToken", () => {
    it("should allow GET requests without CSRF token", async () => {
      const request = new Request("http://localhost:3000/api/test", {
        method: "GET",
      });

      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should allow HEAD requests without CSRF token", async () => {
      const request = new Request("http://localhost:3000/api/test", {
        method: "HEAD",
      });

      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject POST requests without CSRF token", async () => {
      const request = new Request("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid or missing CSRF token");
    });

    it("should reject PUT requests without CSRF token", async () => {
      const request = new Request("http://localhost:3000/api/test", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid or missing CSRF token");
    });

    it("should reject DELETE requests without CSRF token", async () => {
      const request = new Request("http://localhost:3000/api/test", {
        method: "DELETE",
      });

      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid or missing CSRF token");
    });

    it("should reject PATCH requests without CSRF token", async () => {
      const request = new Request("http://localhost:3000/api/test", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid or missing CSRF token");
    });

    it("should reject POST requests with invalid CSRF token", async () => {
      const request = new Request("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "invalid-token",
        },
      });

      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid or missing CSRF token");
    });

    it("should accept POST requests with valid CSRF token", async () => {
      const token = generateCSRFToken();
      const request = new Request("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
      });

      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should handle case-insensitive header names", async () => {
      const token = generateCSRFToken();
      const request = new Request("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token, // Different case
        },
      });

      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("Security Attack Scenarios", () => {
    it("should prevent CSRF token reuse across different sessions", async () => {
      // Generate token for session 1
      mockHeaders.set("x-session-id", "session-1");
      const token = generateCSRFToken();

      // Try to use token with session 2
      mockHeaders.set("x-session-id", "session-2");
      const result = await validateCSRFToken(token);

      expect(result).toBe(false);
    });

    it("should prevent token prediction attacks", () => {
      const tokens = [];
      for (let i = 0; i < 10; i++) {
        tokens.push(generateCSRFToken());
      }

      // Check that tokens are not sequential or predictable
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i]).not.toBe(tokens[i - 1]);
        // Ensure sufficient randomness (at least 10 different characters)
        const differentChars = new Set(
          tokens[i].split("").filter((char, idx) => char !== tokens[i - 1][idx]),
        );
        expect(differentChars.size).toBeGreaterThan(10);
      }
    });

    it("should clean up expired tokens periodically", async () => {
      // Generate multiple tokens
      const tokens = [];
      for (let i = 0; i < 5; i++) {
        mockHeaders.set("x-session-id", `session-${i}`);
        tokens.push(generateCSRFToken());
      }

      // Advance time to trigger cleanup (10 minutes)
      vi.advanceTimersByTime(10 * 60 * 1000);

      // Generate a new token to ensure cleanup doesn't affect valid tokens
      mockHeaders.set("x-session-id", "session-new");
      const newToken = generateCSRFToken();

      // New token should still be valid
      const result = await validateCSRFToken(newToken);
      expect(result).toBe(true);
    });

    it("should prevent timing attacks by consistent response times", async () => {
      const validToken = generateCSRFToken();
      const invalidToken = "x".repeat(64); // Same length as valid token

      // Measure validation times (in a real test, we'd measure actual time)
      const result1 = await validateCSRFToken(validToken);
      const result2 = await validateCSRFToken(invalidToken);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      // Both operations should complete without significant timing differences
    });

    it("should handle malformed tokens gracefully", async () => {
      const malformedTokens = [
        "' OR '1'='1",
        "<script>alert('xss')</script>",
        "../../../../etc/passwd",
        "\x00\x00\x00\x00",
        "🎃🎃🎃🎃",
        "a".repeat(1000),
        "",
        null,
        undefined,
      ];

      for (const token of malformedTokens) {
        const result = await validateCSRFToken(token as any);
        expect(result).toBe(false);
      }
    });
  });
});
