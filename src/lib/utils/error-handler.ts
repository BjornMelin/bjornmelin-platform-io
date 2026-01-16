import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_SERVER_ERROR",
  ) {
    super(message);
    this.name = "APIError";
  }
}

export function handleAPIError(error: unknown) {
  // Log defensively to avoid serialization issues in some environments.
  const errorMessage = error instanceof Error ? error.message : String(error);
  try {
    console.error("API Error:", error);
  } catch {
    console.error("API Error:", errorMessage);
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.issues,
      },
      { status: 400 },
    );
  }

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode },
    );
  }

  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR",
    },
    { status: 500 },
  );
}
