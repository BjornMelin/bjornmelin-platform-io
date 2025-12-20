/* @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mock before importing modules
const mockSend = vi.fn();

vi.mock("@/lib/email/resend-client", () => ({
  getResendClient: () => ({
    emails: { send: mockSend },
  }),
}));

describe("sendContactEmail", () => {
  beforeEach(() => {
    mockSend.mockReset();
    vi.resetModules();
  });

  it("calls Resend with correct parameters", async () => {
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });

    const { sendContactEmail } = await import("@/lib/email/send-contact-email");

    await sendContactEmail({
      data: { name: "John Doe", email: "john@example.com", message: "Hello!" },
      from: "Contact Form <contact@example.com>",
      to: "recipient@example.com",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Contact Form <contact@example.com>",
        to: "recipient@example.com",
        replyTo: "john@example.com",
        subject: "Contact Form: John Doe",
      }),
    );
  });

  it("uses replyTo from form data", async () => {
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });

    const { sendContactEmail } = await import("@/lib/email/send-contact-email");

    await sendContactEmail({
      data: { name: "Test", email: "reply-here@example.com", message: "Test" },
      from: "Contact Form <contact@example.com>",
      to: "recipient@example.com",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: "reply-here@example.com",
      }),
    );
  });

  it("throws on Resend API error", async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: "Invalid API key", name: "validation_error" },
    });

    const { sendContactEmail } = await import("@/lib/email/send-contact-email");

    await expect(
      sendContactEmail({
        data: { name: "Test", email: "test@example.com", message: "Test" },
        from: "Contact Form <contact@example.com>",
        to: "recipient@example.com",
      }),
    ).rejects.toThrow("Failed to send email: Invalid API key");
  });

  it("succeeds when no error returned", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-123" }, error: null });

    const { sendContactEmail } = await import("@/lib/email/send-contact-email");

    await expect(
      sendContactEmail({
        data: { name: "Test", email: "test@example.com", message: "Test" },
        from: "Contact Form <contact@example.com>",
        to: "recipient@example.com",
      }),
    ).resolves.toBeUndefined();

    expect(mockSend).toHaveBeenCalledOnce();
  });
});
