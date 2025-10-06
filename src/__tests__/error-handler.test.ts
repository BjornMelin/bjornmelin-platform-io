import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

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
    const zodError = new ZodError([
      {
        code: "too_small",
        minimum: 1,
        type: "string",
        inclusive: true,
        message: "Required",
        path: ["name"],
      },
    ]);

    const response = handleAPIError(zodError);
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
});
