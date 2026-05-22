import { describe, expect, it } from "vitest";
import { contactFormWithSecuritySchema } from "@/lib/schemas/contact";

describe("contactFormWithSecuritySchema", () => {
  const validPayload = {
    name: "Test User",
    email: "test@example.com",
    message: "This is a test message that satisfies validation.",
    honeypot: "",
    formLoadTime: Date.now() - 5000,
  };

  it("accepts the security fields required by the contact Lambda", () => {
    const result = contactFormWithSecuritySchema.safeParse(validPayload);

    expect(result.success).toBe(true);
  });

  it("requires a positive form load timestamp", () => {
    const missing = contactFormWithSecuritySchema.safeParse({
      ...validPayload,
      formLoadTime: undefined,
    });
    const zero = contactFormWithSecuritySchema.safeParse({
      ...validPayload,
      formLoadTime: 0,
    });

    expect(missing.success).toBe(false);
    expect(zero.success).toBe(false);
  });
});
