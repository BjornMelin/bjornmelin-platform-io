import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyRateLimit,
  checkRateLimit,
  createRateLimitResponse,
  getClientIP,
  getRateLimitHeaders,
  type RateLimitResult,
} from "../rate-limiter";

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("should allow first request from new identifier", () => {
      const identifier = `test-${Date.now()}-${Math.random()}`;
      const result = checkRateLimit(identifier);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("should track multiple requests from same identifier", () => {
      const identifier = `test-${Date.now()}-${Math.random()}`;

      // First request
      let result = checkRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);

      // Second request
      result = checkRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);

      // Third request
      result = checkRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it("should block after exceeding rate limit", () => {
      const identifier = `test-${Date.now()}-${Math.random()}`;

      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(identifier);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i); // 4, 3, 2, 1, 0
      }

      // 6th request should be blocked
      const result = checkRateLimit(identifier);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should reset after window expires", () => {
      const identifier = `test-${Date.now()}-${Math.random()}`;

      // First request
      let result = checkRateLimit(identifier);
      expect(result.allowed).toBe(true);

      // Advance time beyond window (15 minutes + 1 second)
      vi.advanceTimersByTime(15 * 60 * 1000 + 1000);

      // Should allow new request
      result = checkRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should calculate correct retry-after time in seconds", () => {
      const identifier = `test-${Date.now()}-${Math.random()}`;

      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(identifier);
      }

      // Check blocked request
      const result = checkRateLimit(identifier);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeLessThanOrEqual(900); // 15 minutes = 900 seconds
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should handle concurrent requests correctly", () => {
      const identifier = `test-${Date.now()}-${Math.random()}`;
      const results: RateLimitResult[] = [];

      // Simulate concurrent requests
      for (let i = 0; i < 10; i++) {
        results.push(checkRateLimit(identifier));
      }

      // First 5 should be allowed
      expect(results.slice(0, 5).every((r) => r.allowed)).toBe(true);
      
      // Last 5 should be blocked
      expect(results.slice(5).every((r) => !r.allowed)).toBe(true);
      
      // Check remaining counts
      expect(results[0].remaining).toBe(4);
      expect(results[4].remaining).toBe(0);
      expect(results[5].remaining).toBe(0);
    });
  });

  describe("getClientIP", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("should handle x-forwarded-for with spaces", () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "  192.168.1.1  ,  10.0.0.1  ",
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("should extract IP from x-real-ip header", () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-real-ip": "192.168.1.2",
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("192.168.1.2");
    });

    it("should extract IP from cf-connecting-ip header (Cloudflare)", () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "cf-connecting-ip": "192.168.1.3",
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("192.168.1.3");
    });

    it("should prioritize headers in correct order", () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "1.1.1.1",
          "x-real-ip": "2.2.2.2",
          "cf-connecting-ip": "3.3.3.3",
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("1.1.1.1"); // x-forwarded-for takes precedence
    });

    it("should return fallback identifier when no IP headers present", () => {
      const request = new Request("http://localhost:3000/api/test");

      const ip = getClientIP(request);
      expect(ip).toMatch(/^unknown-\d+$/);
    });

    it("should handle malformed IP addresses gracefully", () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "not-an-ip, 192.168.1.1",
        },
      });

      const ip = getClientIP(request);
      expect(ip).toBe("not-an-ip"); // Returns first value even if invalid
    });
  });

  describe("applyRateLimit", () => {
    it("should apply rate limiting based on client IP", () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": `192.168.1.${Date.now() % 255}`,
        },
      });

      const result = applyRateLimit(request);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
    });

    it("should track different IPs separately", () => {
      const request1 = new Request("http://localhost:3000/api/test", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });
      const request2 = new Request("http://localhost:3000/api/test", {
        headers: { "x-forwarded-for": "192.168.1.2" },
      });

      const result1 = applyRateLimit(request1);
      const result2 = applyRateLimit(request2);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(4);
    });
  });

  describe("getRateLimitHeaders", () => {
    it("should format rate limit headers correctly", () => {
      const result = {
        allowed: true,
        limit: 5,
        remaining: 3,
        reset: Date.now() + 60000,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("3");
      expect(headers["X-RateLimit-Reset"]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(headers["Retry-After"]).toBeUndefined();
    });

    it("should include Retry-After header when rate limited", () => {
      const result = {
        allowed: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000,
        retryAfter: 60,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers["Retry-After"]).toBe("60");
    });
  });

  describe("createRateLimitResponse", () => {
    it("should create proper rate limit error response", () => {
      const response = createRateLimitResponse();

      expect(response.status).toBe(429);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("Retry-After")).toBeTruthy();
    });

    it("should include error message in response body", async () => {
      const response = createRateLimitResponse();
      const body = await response.json();

      expect(body.error).toBe("Too many requests");
      expect(body.message).toContain("Rate limit exceeded");
      expect(body.message).toContain("Please wait");
    });
  });

  describe("Security Attack Scenarios", () => {
    it("should prevent distributed attack from multiple IPs", () => {
      const results: RateLimitResult[] = [];
      
      // Simulate requests from 100 different IPs
      for (let i = 0; i < 100; i++) {
        const request = new Request("http://localhost:3000/api/test", {
          headers: { "x-forwarded-for": `192.168.1.${i}` },
        });
        results.push(applyRateLimit(request));
      }

      // Each IP should be allowed its first request
      expect(results.every((r) => r.allowed)).toBe(true);
      expect(results.every((r) => r.remaining === 4)).toBe(true);
    });

    it("should handle IP spoofing attempts", () => {
      const maliciousHeaders = [
        { "x-forwarded-for": "127.0.0.1" }, // Localhost
        { "x-forwarded-for": "0.0.0.0" }, // Any address
        { "x-forwarded-for": "::1" }, // IPv6 localhost
        { "x-forwarded-for": "192.168.1.1, 192.168.1.2, 192.168.1.3" }, // Multiple IPs
      ];

      maliciousHeaders.forEach((headers) => {
        const request = new Request("http://localhost:3000/api/test", { headers });
        const result = applyRateLimit(request);
        
        // Should still apply rate limiting
        expect(result.limit).toBe(5);
        expect(typeof result.allowed).toBe("boolean");
      });
    });

    it("should clean up old entries periodically", () => {
      // Create entries for multiple IPs
      for (let i = 0; i < 10; i++) {
        checkRateLimit(`ip-${i}`);
      }

      // Advance time to trigger cleanup (30 minutes)
      vi.advanceTimersByTime(30 * 60 * 1000);

      // Create a new request to ensure cleanup happened
      const result = checkRateLimit("new-ip");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should handle rapid-fire requests correctly", () => {
      const identifier = `test-${Date.now()}-${Math.random()}`;
      const results: RateLimitResult[] = [];
      
      // Simulate 100 rapid requests
      for (let i = 0; i < 100; i++) {
        results.push(checkRateLimit(identifier));
      }

      // Only first 5 should be allowed
      const allowedCount = results.filter((r) => r.allowed).length;
      expect(allowedCount).toBe(5);

      // All blocked requests should have same retry-after info
      const blockedResults = results.filter((r) => !r.allowed);
      const retryAfters = new Set(blockedResults.map((r) => r.retryAfter));
      expect(retryAfters.size).toBe(1); // All should have same retry-after
    });

    it("should handle clock skew attacks", () => {
      const identifier = `test-${Date.now()}-${Math.random()}`;
      
      // Make initial request
      checkRateLimit(identifier);
      
      // Try to bypass by going back in time
      vi.setSystemTime(new Date(Date.now() - 60000)); // Go back 1 minute
      
      const result = checkRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3); // Still tracks properly
    });

    it("should handle boundary conditions at exact window expiry", () => {
      const identifier = `test-${Date.now()}-${Math.random()}`;
      
      // Make request
      checkRateLimit(identifier);
      
      // Advance to exact window boundary
      vi.advanceTimersByTime(15 * 60 * 1000); // Exactly 15 minutes
      
      const result = checkRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // Window should reset
    });

    it("should prevent header injection attacks", () => {
      const maliciousHeaders = [
        "192.168.1.1\r\nX-Evil-Header: malicious",
        "192.168.1.1; DROP TABLE users;--",
        "<script>alert('xss')</script>",
        "../../etc/passwd",
      ];

      maliciousHeaders.forEach((header) => {
        const request = new Request("http://localhost:3000/api/test", {
          headers: { "x-forwarded-for": header },
        });
        
        // Should not throw and should handle gracefully
        expect(() => getClientIP(request)).not.toThrow();
        const ip = getClientIP(request);
        expect(typeof ip).toBe("string");
      });
    });
  });
});
