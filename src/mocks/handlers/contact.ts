import { HttpResponse, http } from "msw";

/**
 * Default success handler for contact form API
 */
export const contactSuccessHandler = http.post("*/contact", () => {
  return HttpResponse.json({ success: true });
});

/**
 * Error handler - 500 server error
 */
export const contactServerErrorHandler = http.post("*/contact", () => {
  return HttpResponse.json({ error: "Server error" }, { status: 500 });
});

/**
 * Rate limit handler - 429 response
 */
export const contactRateLimitHandler = http.post("*/contact", () => {
  return HttpResponse.json({ error: "Too many requests" }, { status: 429 });
});

/**
 * Validation error handler - 400 response
 */
export const contactValidationErrorHandler = http.post("*/contact", () => {
  return HttpResponse.json(
    { code: "VALIDATION_ERROR", error: "Invalid submission" },
    { status: 400 },
  );
});

/**
 * Default handlers for contact API
 * Success by default - override with server.use() for error cases
 */
export const contactHandlers = [contactSuccessHandler];
