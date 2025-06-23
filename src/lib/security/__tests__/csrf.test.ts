import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkCSRFToken, generateCSRFToken, validateCSRFToken } from "../csrf";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => {
      if (key === "x-session-id") return "test-session-id";
      return null;
    }),
  })),
}));

describe("CSRF Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    it("should reject POST requests with invalid CSRF token", async () => {
      const request = new Request("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "invalid-token",
        },
      });

      const result = await checkCSRFToken(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid or missing CSRF token");
    });
  });
});
