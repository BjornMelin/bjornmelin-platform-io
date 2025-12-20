/* @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, getRateLimitInfo, resetRateLimit } from "@/lib/security/rate-limiter";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up test IPs
    resetRateLimit("test-ip");
    resetRateLimit("test-ip-1");
    resetRateLimit("test-ip-2");
  });

  it("allows first request from new IP", () => {
    expect(checkRateLimit("test-ip")).toBe(true);
  });

  it("allows up to 5 requests within window", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("test-ip")).toBe(true);
    }
  });

  it("blocks 6th request from same IP", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-ip");
    }
    expect(checkRateLimit("test-ip")).toBe(false);
  });

  it("resets after window expires (60s)", () => {
    // Use all 5 requests
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-ip");
    }
    expect(checkRateLimit("test-ip")).toBe(false);

    // Advance past the 60 second window
    vi.advanceTimersByTime(60_001);

    // Should now allow requests again
    expect(checkRateLimit("test-ip")).toBe(true);
  });

  it("tracks multiple IPs independently", () => {
    // Use all requests for IP 1
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-ip-1");
    }
    expect(checkRateLimit("test-ip-1")).toBe(false);

    // IP 2 should still have full quota
    expect(checkRateLimit("test-ip-2")).toBe(true);
  });

  it("treats expired entry as new", () => {
    // Make initial request
    checkRateLimit("test-ip");

    // Advance past window
    vi.advanceTimersByTime(60_001);

    // Should behave as new IP with full quota
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("test-ip")).toBe(true);
    }
    // Verify 6th request is blocked again
    expect(checkRateLimit("test-ip")).toBe(false);
  });
});

describe("getRateLimitInfo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimit("test-ip");
  });

  it("returns full limit for new IP", () => {
    const info = getRateLimitInfo("test-ip");
    expect(info.remaining).toBe(5);
    expect(info.resetTime).toBe(Date.now() + 60_000);
  });

  it("returns remaining count for active IP", () => {
    // Make 3 requests
    checkRateLimit("test-ip");
    checkRateLimit("test-ip");
    checkRateLimit("test-ip");

    const info = getRateLimitInfo("test-ip");
    expect(info.remaining).toBe(2);
  });

  it("returns reset time for active window", () => {
    const startTime = Date.now();
    checkRateLimit("test-ip");

    const info = getRateLimitInfo("test-ip");
    expect(info.resetTime).toBe(startTime + 60_000);
  });

  it("returns 0 remaining when limit exceeded", () => {
    for (let i = 0; i < 6; i++) {
      checkRateLimit("test-ip");
    }

    const info = getRateLimitInfo("test-ip");
    expect(info.remaining).toBe(0);
  });
});

describe("resetRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clears rate limit for specific IP", () => {
    // Use all requests
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-ip");
    }
    expect(checkRateLimit("test-ip")).toBe(false);

    // Reset
    resetRateLimit("test-ip");

    // Should now allow requests again
    expect(checkRateLimit("test-ip")).toBe(true);
  });

  it("does nothing for non-existent IP", () => {
    // Should not throw
    expect(() => resetRateLimit("non-existent-ip")).not.toThrow();
  });
});
