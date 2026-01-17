import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { APIError, handleAPIError } from "@/lib/utils/error-handler";

describe("handleAPIError", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("serializes validation issues when a ZodError is received", async () => {
    const result = z.string().min(1).safeParse("");
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected schema to fail validation");
    }

    const response = handleAPIError(result.error);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Validation failed");
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.details).toHaveLength(1);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it("reuses the APIError contract for handled application errors", async () => {
    const apiError = new APIError("Missing resource", 404, "NOT_FOUND");

    const response = handleAPIError(apiError);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({ error: "Missing resource", code: "NOT_FOUND" });
  });

  it("falls back to an internal error response for unknown errors", async () => {
    const response = handleAPIError("unexpected");
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("hides the original message when the error is a generic Error instance", async () => {
    const response = handleAPIError(new Error("Boom"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("falls back to a safe log message when console.error fails", async () => {
    consoleSpy.mockImplementationOnce(() => {
      throw new Error("logger failed");
    });

    const response = handleAPIError(new Error("Boom"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.code).toBe("INTERNAL_SERVER_ERROR");
    expect(consoleSpy).toHaveBeenNthCalledWith(2, "API Error:", "Boom");
  });
});
