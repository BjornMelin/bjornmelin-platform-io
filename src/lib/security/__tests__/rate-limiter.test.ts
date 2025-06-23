import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyRateLimit,
  checkRateLimit,
  createRateLimitResponse,
  getClientIP,
  getRateLimitHeaders,
} from "../rate-limiter";

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the rate limit store by making requests with unique identifiers
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

      // Mock time to simulate window expiration
      const originalDateNow = Date.now;
      let currentTime = originalDateNow();

      Date.now = vi.fn(() => currentTime);

      // First request
      let result = checkRateLimit(identifier);
      expect(result.allowed).toBe(true);

      // Advance time beyond window (15 minutes + 1 second)
      currentTime += 15 * 60 * 1000 + 1000;

      // Should allow new request
      result = checkRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);

      // Restore Date.now
      Date.now = originalDateNow;
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

    it("should return fallback identifier when no IP headers present", () => {
      const request = new Request("http://localhost:3000/api/test");

      const ip = getClientIP(request);
      expect(ip).toMatch(/^unknown-\d+$/);
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
  });
});
