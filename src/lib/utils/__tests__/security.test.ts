import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  generateCSRFToken,
  getClientIp,
  type RateLimitConfig,
  rateLimit,
  sanitizeInput,
  validateCSRFToken,
} from "../security";

describe("Security Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear rate limit store between tests
    rateLimit.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sanitizeInput", () => {
    it("removes HTML tags", () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeInput(input);
      expect(result).toBe("Hello World");
    });

    it("removes multiple types of HTML tags", () => {
      const input = '<div><p>Hello</p><script>evil</script><a href="#">World</a></div>';
      const result = sanitizeInput(input);
      expect(result).toBe("HelloWorld");
    });

    it("handles nested tags", () => {
      const input = "<div>Hello <span><script>evil</script>World</span></div>";
      const result = sanitizeInput(input);
      expect(result).toBe("Hello World");
    });

    it("preserves text without HTML", () => {
      const input = "This is plain text without HTML";
      const result = sanitizeInput(input);
      expect(result).toBe("This is plain text without HTML");
    });

    it("handles text with angle brackets", () => {
      const input = "This is plain text with <3 and > symbols";
      const result = sanitizeInput(input);
      expect(result).toBe("This is plain text with  symbols");
    });

    it("handles empty strings", () => {
      expect(sanitizeInput("")).toBe("");
    });

    it("handles null and undefined gracefully", () => {
      expect(sanitizeInput(null as unknown as string)).toBe("");
      expect(sanitizeInput(undefined as unknown as string)).toBe("");
    });

    it("removes script event handlers", () => {
      const input = '<img src="x" onerror="alert(1)">text';
      const result = sanitizeInput(input);
      expect(result).toBe("text");
    });
  });

  describe("CSRF Token", () => {
    it("generates unique tokens", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
    });

    it("generates tokens of correct length", () => {
      const token = generateCSRFToken();
      // Base64 encoding of 32 bytes should be 44 characters (with padding)
      expect(token.length).toBeGreaterThanOrEqual(43);
      expect(token.length).toBeLessThanOrEqual(44);
    });

    it("validates matching tokens", () => {
      const token = generateCSRFToken();
      expect(validateCSRFToken(token, token)).toBe(true);
    });

    it("rejects non-matching tokens", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(validateCSRFToken(token1, token2)).toBe(false);
    });

    it("rejects empty or invalid tokens", () => {
      const token = generateCSRFToken();
      expect(validateCSRFToken("", token)).toBe(false);
      expect(validateCSRFToken(token, "")).toBe(false);
      expect(validateCSRFToken("", "")).toBe(false);
      expect(validateCSRFToken(null as unknown as string, token)).toBe(false);
      expect(validateCSRFToken(token, undefined as unknown as string)).toBe(false);
    });
  });

  describe("Rate Limiting", () => {
    const defaultConfig: RateLimitConfig = {
      maxRequests: 5,
      windowMs: 60000, // 1 minute
    };

    it("allows requests within limit", () => {
      const identifier = "test-user-1";

      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(identifier, defaultConfig);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it("blocks requests exceeding limit", () => {
      const identifier = "test-user-2";

      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit(identifier, defaultConfig);
      }

      // 6th request should be blocked
      const result = checkRateLimit(identifier, defaultConfig);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it("resets after time window", () => {
      const identifier = "test-user-3";
      const shortWindowConfig: RateLimitConfig = {
        maxRequests: 2,
        windowMs: 50, // 50ms window
      };

      // Make 2 requests (hitting the limit)
      checkRateLimit(identifier, shortWindowConfig);
      checkRateLimit(identifier, shortWindowConfig);

      // Should be blocked
      let result = checkRateLimit(identifier, shortWindowConfig);
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          // Should be allowed again
          result = checkRateLimit(identifier, shortWindowConfig);
          expect(result.allowed).toBe(true);
          expect(result.remaining).toBe(1);
          resolve(undefined);
        }, 60);
      });
    });

    it("tracks different identifiers separately", () => {
      const result1 = checkRateLimit("user1", defaultConfig);
      const result2 = checkRateLimit("user2", defaultConfig);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(4);
    });

    it("handles concurrent requests correctly", () => {
      const identifier = "concurrent-user";
      const promises = [];

      // Make 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve(checkRateLimit(identifier, defaultConfig)));
      }

      return Promise.all(promises).then((results) => {
        const allowedCount = results.filter((r) => r.allowed).length;
        const blockedCount = results.filter((r) => !r.allowed).length;

        expect(allowedCount).toBe(5);
        expect(blockedCount).toBe(5);
      });
    });
  });

  describe("getClientIp", () => {
    it("extracts IP from x-forwarded-for header", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      });

      expect(getClientIp(request)).toBe("192.168.1.1");
    });

    it("extracts IP from x-real-ip header", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-real-ip": "192.168.1.2",
        },
      });

      expect(getClientIp(request)).toBe("192.168.1.2");
    });

    it("prioritizes x-forwarded-for over x-real-ip", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-real-ip": "192.168.1.2",
        },
      });

      expect(getClientIp(request)).toBe("192.168.1.1");
    });

    it("returns fallback when no IP headers present", () => {
      const request = new Request("http://localhost");
      expect(getClientIp(request)).toBe("unknown");
    });

    it("handles IPv6 addresses", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        },
      });

      expect(getClientIp(request)).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    });

    it("handles malformed headers gracefully", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "  ,  ,  ",
          "x-real-ip": "",
        },
      });

      expect(getClientIp(request)).toBe("unknown");
    });
  });

  describe("Rate Limit Store", () => {
    it("can be cleared", () => {
      // Add some entries
      checkRateLimit("user1");
      checkRateLimit("user2");

      // Clear the store
      rateLimit.clear();

      // Both users should be able to make requests again
      const result1 = checkRateLimit("user1");
      const result2 = checkRateLimit("user2");

      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(4);
    });

    it("automatically cleans up expired entries", () => {
      const shortWindowConfig: RateLimitConfig = {
        maxRequests: 1,
        windowMs: 50,
      };

      // Make a request
      checkRateLimit("temp-user", shortWindowConfig);

      // Wait for expiry and make another request with different user
      // This should trigger cleanup of expired entries
      return new Promise((resolve) => {
        setTimeout(() => {
          checkRateLimit("another-user", shortWindowConfig);
          // Original user should be allowed again (entry was cleaned up)
          const result = checkRateLimit("temp-user", shortWindowConfig);
          expect(result.allowed).toBe(true);
          resolve(undefined);
        }, 60);
      });
    });
  });
});
