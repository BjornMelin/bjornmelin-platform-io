/* @vitest-environment node */
import { describe, expect, it } from "vitest";

describe("barrel exports", () => {
  it("exports email helpers", async () => {
    const email = await import("@/lib/email");

    expect(typeof email.createContactEmailHtml).toBe("function");
    expect(typeof email.createContactEmailText).toBe("function");
    expect(typeof email.getResendClient).toBe("function");
    expect(typeof email.sendContactEmail).toBe("function");
  });

  it("exports security helpers", async () => {
    const security = await import("@/lib/security");

    expect(typeof security.checkRateLimit).toBe("function");
    expect(typeof security.getRateLimitInfo).toBe("function");
    expect(typeof security.resetRateLimit).toBe("function");
    expect(typeof security.isHoneypotTriggered).toBe("function");
    expect(typeof security.isSubmissionTooFast).toBe("function");
  });
});
