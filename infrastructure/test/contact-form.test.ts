import { describe, expect, it, vi } from "vitest";

describe("contact-form resolveRecipientEmail", () => {
  it("reads from SSM and caches result", async () => {
    // Set required env seen at module load
    process.env.REGION = "us-east-1";
    process.env.SENDER_EMAIL = "no-reply@example.com";
    process.env.SSM_RECIPIENT_EMAIL_PARAM = "/portfolio/prod/CONTACT_EMAIL";

    vi.mock("../lib/utils/ssm", () => ({
      getParameter: vi.fn(async () => "recipient@example.com"),
    }));

    const mod = await import("../lib/functions/contact-form/index");
    const first = await mod.resolveRecipientEmail();
    const second = await mod.resolveRecipientEmail();
    expect(first).toBe("recipient@example.com");
    expect(second).toBe("recipient@example.com");
  });
});
