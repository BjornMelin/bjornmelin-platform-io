/* @vitest-environment node */
import { describe, expect, it } from "vitest";
import { isHoneypotTriggered } from "@/lib/security/honeypot";

describe("isHoneypotTriggered", () => {
  it("returns false for undefined", () => {
    expect(isHoneypotTriggered(undefined)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isHoneypotTriggered(null)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isHoneypotTriggered("")).toBe(false);
  });

  it("returns true for any non-empty string", () => {
    expect(isHoneypotTriggered("bot-filled")).toBe(true);
    expect(isHoneypotTriggered("a")).toBe(true);
    expect(isHoneypotTriggered("spam@example.com")).toBe(true);
  });

  it("returns false for whitespace-only string", () => {
    // Whitespace-only strings are treated as empty to avoid false positives
    // from accidental spaces in legitimate form submissions
    expect(isHoneypotTriggered(" ")).toBe(false);
    expect(isHoneypotTriggered("   ")).toBe(false);
    expect(isHoneypotTriggered("\t")).toBe(false);
  });
});
