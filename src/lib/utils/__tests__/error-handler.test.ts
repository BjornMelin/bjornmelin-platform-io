import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { APIError, handleAPIError } from "../error-handler";

describe("Error Handler Utilities", () => {
  let mockConsoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
  });

  describe("APIError", () => {
    it("creates error with default values", () => {
      const error = new APIError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(error.name).toBe("APIError");
    });

    it("creates error with custom status and code", () => {
      const error = new APIError("Not found", 404, "NOT_FOUND");

      expect(error.message).toBe("Not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    });

    it("is instanceof Error", () => {
      const error = new APIError("Test");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(APIError);
    });
  });

  describe("handleAPIError", () => {
    it("handles ZodError with validation details", async () => {
      const zodError = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["email"],
          message: "Expected string, received number",
        },
        {
          code: "too_small",
          minimum: 5,
          type: "string",
          inclusive: true,
          exact: false,
          message: "String must contain at least 5 character(s)",
          path: ["name"],
        },
      ]);

      const response = handleAPIError(zodError);
      const data = await response.json();

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: "Validation failed",
        details: zodError.errors,
      });
      expect(mockConsoleError).toHaveBeenCalledWith("API Error:", zodError);
    });

    it("handles APIError with custom status and code", async () => {
      const apiError = new APIError("Resource not found", 404, "RESOURCE_NOT_FOUND");

      const response = handleAPIError(apiError);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: "Resource not found",
        code: "RESOURCE_NOT_FOUND",
      });
      expect(mockConsoleError).toHaveBeenCalledWith("API Error:", apiError);
    });

    it("handles generic Error", async () => {
      const error = new Error("Something went wrong");

      const response = handleAPIError(error);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "Something went wrong",
        code: "INTERNAL_SERVER_ERROR",
      });
      expect(mockConsoleError).toHaveBeenCalledWith("API Error:", error);
    });

    it("handles unknown error types", async () => {
      const unknownError = { some: "object" };

      const response = handleAPIError(unknownError);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "An unexpected error occurred",
        code: "INTERNAL_SERVER_ERROR",
      });
      expect(mockConsoleError).toHaveBeenCalledWith("API Error:", unknownError);
    });

    it("handles string errors", async () => {
      const stringError = "Something bad happened";

      const response = handleAPIError(stringError);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: "An unexpected error occurred",
        code: "INTERNAL_SERVER_ERROR",
      });
      expect(mockConsoleError).toHaveBeenCalledWith("API Error:", stringError);
    });

    it("handles null and undefined", async () => {
      const nullResponse = handleAPIError(null);
      const undefinedResponse = handleAPIError(undefined);

      expect(nullResponse.status).toBe(500);
      expect(await nullResponse.json()).toEqual({
        error: "An unexpected error occurred",
        code: "INTERNAL_SERVER_ERROR",
      });

      expect(undefinedResponse.status).toBe(500);
      expect(await undefinedResponse.json()).toEqual({
        error: "An unexpected error occurred",
        code: "INTERNAL_SERVER_ERROR",
      });
    });
  });
});
