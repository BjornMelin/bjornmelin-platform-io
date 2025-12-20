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

  it("returns true for whitespace-only string", () => {
    // Whitespace is still a non-empty string, so it triggers
    expect(isHoneypotTriggered(" ")).toBe(true);
    expect(isHoneypotTriggered("   ")).toBe(true);
    expect(isHoneypotTriggered("\t")).toBe(true);
  });
});
