/* @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMinSubmissionTime, isSubmissionTooFast } from "@/lib/security/time-check";

describe("isSubmissionTooFast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for instant submission (0ms)", () => {
    const formLoadTime = Date.now();
    expect(isSubmissionTooFast(formLoadTime)).toBe(true);
  });

  it("returns true for 2999ms elapsed", () => {
    const formLoadTime = Date.now();
    vi.advanceTimersByTime(2999);
    expect(isSubmissionTooFast(formLoadTime)).toBe(true);
  });

  it("returns false for exactly 3000ms elapsed", () => {
    const formLoadTime = Date.now();
    vi.advanceTimersByTime(3000);
    expect(isSubmissionTooFast(formLoadTime)).toBe(false);
  });

  it("returns false for 5000ms elapsed", () => {
    const formLoadTime = Date.now();
    vi.advanceTimersByTime(5000);
    expect(isSubmissionTooFast(formLoadTime)).toBe(false);
  });

  it("returns false for very old formLoadTime", () => {
    // Form loaded 1 hour ago
    const formLoadTime = Date.now() - 3_600_000;
    expect(isSubmissionTooFast(formLoadTime)).toBe(false);
  });
});

describe("getMinSubmissionTime", () => {
  it("returns 3000", () => {
    expect(getMinSubmissionTime()).toBe(3000);
  });
});
