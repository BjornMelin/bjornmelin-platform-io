/* @vitest-environment node */

import type { SendEmailCommandInput } from "@aws-sdk/client-ses";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactFormData } from "@/lib/schemas/contact";

const sendSpy = vi.fn();
const sendEmailCommandPayloads: unknown[] = [];

const extractSesBody = (payload: SendEmailCommandInput): { htmlData: string; textData: string } => {
  const message = payload.Message;
  if (!message) {
    throw new Error("Expected the SES payload to include a message.");
  }

  const body = message.Body;
  if (!body) {
    throw new Error("Expected the SES message to include a body.");
  }

  const text = body.Text;
  if (!text?.Data) {
    throw new Error("Expected the SES message body to include text content.");
  }

  const html = body.Html;
  if (!html?.Data) {
    throw new Error("Expected the SES message body to include HTML content.");
  }

  return { htmlData: html.Data, textData: text.Data };
};

vi.mock("@/lib/aws/ses", () => ({
  createSESClient: vi.fn(() => ({
    send: sendSpy,
  })),
}));

vi.mock("@aws-sdk/client-ses", () => ({
  SendEmailCommand: class {
    public readonly input: unknown;

    constructor(input: unknown) {
      this.input = input;
      sendEmailCommandPayloads.push(input);
    }
  },
  SESClient: vi.fn(),
}));

describe("EmailService", () => {
  beforeEach(() => {
    vi.resetModules();
    sendSpy.mockClear();
    sendEmailCommandPayloads.length = 0;
  });

  it("reuses a single instance", async () => {
    const { EmailService } = await import("@/lib/services/email");

    const instanceA = EmailService.getInstance();
    const instanceB = EmailService.getInstance();

    expect(instanceA).toBe(instanceB);
  });

  it("sends a contact email with both HTML and plain text payloads", async () => {
    vi.useFakeTimers();
    const fixedDate = new Date("2024-01-01T00:00:00.000Z");
    vi.setSystemTime(fixedDate);

    try {
      const { EmailService } = await import("@/lib/services/email");
      const service = EmailService.getInstance();

      const formData: ContactFormData = {
        name: "Jane Doe",
        email: "jane@example.com",
        message: "Interested in learning more about your work.",
      };

      await service.sendContactFormEmail(formData);

      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailCommandPayloads).toHaveLength(1);

      const payload = sendEmailCommandPayloads[0] as SendEmailCommandInput;
      expect(payload).toMatchObject({
        Source: "no-reply@example.com",
        Destination: {
          ToAddresses: ["test@example.com"],
        },
        Message: {
          Subject: {
            Data: "New Contact Form Submission from Jane Doe",
            Charset: "UTF-8",
          },
        },
      });

      const { htmlData, textData } = extractSesBody(payload);

      expect(textData).toContain("Name: Jane Doe");
      expect(textData).toContain("Email: jane@example.com");
      expect(textData).toContain("Message: Interested in learning more about your work.");
      expect(textData).toContain("2024-01-01T00:00:00.000Z");
      expect(htmlData).toContain("<p><strong>Name:</strong> Jane Doe</p>");
      expect(htmlData).toContain("<p><strong>Email:</strong> jane@example.com</p>");
      expect(htmlData).toContain("<p>Interested in learning more about your work.</p>");
      expect(htmlData).toContain("2024-01-01T00:00:00.000Z");
    } finally {
      vi.useRealTimers();
    }
  });
});
