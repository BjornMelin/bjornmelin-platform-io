export type BlogErrorCode =
  | "POST_NOT_FOUND"
  | "SLUG_EXISTS"
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "DATABASE_ERROR"
  | "VALIDATION_ERROR";

export class BlogError extends Error {
  constructor(
    public code: BlogErrorCode,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "BlogError";
  }
}

export const createBlogError = (
  code: BlogErrorCode,
  message: string,
  context?: Record<string, unknown>
) => {
  return new BlogError(code, message, context);
};

export const isBlogError = (error: unknown): error is BlogError => {
  return error instanceof BlogError;
};
