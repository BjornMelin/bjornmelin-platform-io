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
  // Use defensive logging to avoid serialization issues with ZodError in certain environments
  try {
    console.error("API Error:", error);
  } catch {
    console.error("API Error occurred (details could not be serialized)");
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.errors,
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
