/* @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("rate limiter cleanup interval", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("cleans up expired entries on interval", async () => {
    const deleteSpy = vi.spyOn(Map.prototype, "delete");
    const intervalCallbacks: Array<() => void> = [];
    const intervalSpy = vi.spyOn(globalThis, "setInterval").mockImplementation((callback) => {
      intervalCallbacks.push(callback as () => void);
      return 1 as unknown as ReturnType<typeof setInterval>;
    });

    const { checkRateLimit, stopCleanupInterval } = await import("@/lib/security/rate-limiter");

    checkRateLimit("1.2.3.4");

    expect(intervalSpy).toHaveBeenCalledTimes(1);
    expect(intervalCallbacks).toHaveLength(1);
    const intervalCallback = intervalCallbacks[0];

    const callsBefore = deleteSpy.mock.calls.length;
    vi.setSystemTime(new Date("2024-01-01T00:02:00Z"));
    intervalCallback();
    expect(deleteSpy.mock.calls.length).toBeGreaterThan(callsBefore);

    const callsAfterFirst = deleteSpy.mock.calls.length;
    checkRateLimit("2.3.4.5");
    vi.setSystemTime(new Date("2024-01-01T00:03:01Z"));
    intervalCallback();
    expect(deleteSpy.mock.calls.length).toBeGreaterThan(callsAfterFirst);

    stopCleanupInterval();
  });
});
