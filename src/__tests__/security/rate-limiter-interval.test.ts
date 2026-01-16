/* @vitest-environment node */
import { describe, expect, it, vi } from "vitest";

describe("rate limiter cleanup interval", () => {
  it("registers periodic cleanup outside test env and removes expired entries", async () => {
    const originalNodeEnv = process.env.NODE_ENV;

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    let capturedCallback: (() => void) | undefined;
    let capturedIntervalMs: number | undefined;
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval").mockImplementation(((
      callback: () => void,
      ms: number,
    ) => {
      capturedCallback = callback;
      capturedIntervalMs = ms;
      return 123 as unknown as ReturnType<typeof setInterval>;
    }) as typeof setInterval);
    const clearIntervalSpy = vi
      .spyOn(globalThis, "clearInterval")
      .mockImplementation(() => undefined);

    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      vi.resetModules();

      const mod = await import("@/lib/security/rate-limiter");

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      expect(capturedIntervalMs).toBe(300_000);
      expect(typeof capturedCallback).toBe("function");

      const ip = "cleanup-ip";
      expect(mod.checkRateLimit(ip)).toBe(true);
      const { resetTime } = mod.getRateLimitInfo(ip);

      vi.setSystemTime(resetTime + 1);
      capturedCallback?.();

      expect(mod.getRateLimitInfo(ip).remaining).toBe(5);

      mod.stopCleanupInterval();
      mod.stopCleanupInterval();
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

      mod.resetRateLimit(ip);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });
});
