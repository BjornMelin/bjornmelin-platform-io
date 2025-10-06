import { beforeEach, describe, expect, it, vi } from "vitest";

const sendContactFormEmail = vi.fn();
const getInstance = vi.fn(() => ({ sendContactFormEmail }));

vi.mock("@/lib/services/email", () => ({
  EmailService: {
    getInstance,
  },
}));

describe("POST /api/contact", () => {
  beforeEach(() => {
    sendContactFormEmail.mockReset();
    getInstance.mockClear();
  });

  it("returns success when the payload is valid", async () => {
    const { POST } = await import("@/app/api/contact/route");

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          message: "I would like to get in touch to discuss a project.",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(getInstance).toHaveBeenCalledTimes(1);
    expect(sendContactFormEmail).toHaveBeenCalledWith({
      name: "Test User",
      email: "test@example.com",
      message: "I would like to get in touch to discuss a project.",
    });
  });

  it("returns validation errors when the payload is invalid", async () => {
    const { POST } = await import("@/app/api/contact/route");

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        body: JSON.stringify({ email: "invalid" }),
      }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe("Validation failed");
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(getInstance).not.toHaveBeenCalled();
  });

  it("returns validation errors when required fields are missing", async () => {
    const { POST } = await import("@/app/api/contact/route");

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com" }),
      }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe("Validation failed");
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(getInstance).not.toHaveBeenCalled();
  });

  it("returns validation errors when the request JSON is malformed", async () => {
    const { POST } = await import("@/app/api/contact/route");

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ email: 'test@example.com', name: 'Test' ",
      }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe("Validation failed");
    expect(payload.code).toBe("INVALID_JSON");
    expect(getInstance).not.toHaveBeenCalled();
  });

  it("returns a structured error when the email send fails", async () => {
    const { POST } = await import("@/app/api/contact/route");
    sendContactFormEmail.mockRejectedValueOnce(new Error("Unable to send email"));

    const response = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          message: "Longer message body for the contact form.",
        }),
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to send message. Please try again later.",
      code: "EMAIL_SEND_ERROR",
    });
  });
});
