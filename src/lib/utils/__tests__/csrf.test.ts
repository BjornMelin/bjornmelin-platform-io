import { describe, expect, it, vi } from "vitest";
import { getCSRFToken, validateCSRFFromHeaders } from "../security";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => {
      if (key === "X-CSRF-Token") return "test-csrf-token";
      return null;
    }),
  })),
}));

describe("CSRF Security Functions", () => {
  describe("getCSRFToken", () => {
    it("should retrieve CSRF token from headers", async () => {
      const token = await getCSRFToken();
      expect(token).toBe("test-csrf-token");
    });
  });

  describe("validateCSRFFromHeaders", () => {
    it("should return false if no CSRF token in request", async () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          Cookie: "_csrf=test-cookie-value",
        },
      });

      const result = await validateCSRFFromHeaders(request);
      expect(result).toBe(false);
    });

    it("should return false if no CSRF cookie", async () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "X-CSRF-Token": "test-token",
        },
      });

      const result = await validateCSRFFromHeaders(request);
      expect(result).toBe(false);
    });

    it("should return false if tokens do not match", async () => {
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "X-CSRF-Token": "token-a",
          Cookie: "_csrf=token-b",
        },
      });

      const result = await validateCSRFFromHeaders(request);
      expect(result).toBe(false);
    });

    it("should return true if tokens match", async () => {
      const token = "matching-token";
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "X-CSRF-Token": token,
          Cookie: `_csrf=${token}; other=value`,
        },
      });

      const result = await validateCSRFFromHeaders(request);
      expect(result).toBe(true);
    });

    it("should handle cookie with spaces", async () => {
      const token = "matching-token";
      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          "X-CSRF-Token": token,
          Cookie: ` _csrf=${token} ; other=value`,
        },
      });

      const result = await validateCSRFFromHeaders(request);
      expect(result).toBe(true);
    });
  });
});
