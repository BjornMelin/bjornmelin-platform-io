import { describe, expect, it } from "vitest";
import { z } from "zod";

import { contactFormSchema, contactFormWithSecuritySchema } from "@/lib/schemas/contact";

describe("contactFormSchema", () => {
  it("accepts valid contact submissions", () => {
    const payload = {
      name: "Valid Name",
      email: "valid@example.com",
      message: "This is a sufficiently descriptive contact message.",
    };

    expect(contactFormSchema.parse(payload)).toEqual(payload);
  });

  it("trims visible string fields in parsed contact submissions", () => {
    const payload = {
      name: "  Valid Name  ",
      email: "valid@example.com",
      message: "  This is a sufficiently descriptive contact message.  ",
    };

    expect(contactFormSchema.parse(payload)).toEqual({
      name: "Valid Name",
      email: "valid@example.com",
      message: "This is a sufficiently descriptive contact message.",
    });
  });

  it("rejects invalid submissions with descriptive issues", () => {
    const payload = {
      name: "A",
      email: "invalid",
      message: "short",
    };

    const result = contactFormSchema.safeParse(payload);

    expect(result.success).toBe(false);
    if (!result.success) {
      const tree = z.treeifyError(result.error);
      expect(tree.properties?.name?.errors?.[0]).toContain("at least 2");
      expect(tree.properties?.email?.errors?.[0]).toContain("valid email");
      expect(tree.properties?.message?.errors?.[0]).toContain("at least 10");
    }
  });

  it("accepts empty honeypot and integer form load time in security payloads", () => {
    const payload = {
      name: "Valid Name",
      email: "valid@example.com",
      message: "This is a sufficiently descriptive contact message.",
      honeypot: "",
      formLoadTime: 1_779_436_800_000,
    };

    expect(contactFormWithSecuritySchema.parse(payload)).toEqual(payload);
  });

  it("rejects bot and malformed security payload fields", () => {
    const result = contactFormWithSecuritySchema.safeParse({
      name: "Valid Name",
      email: "valid@example.com",
      message: "This is a sufficiently descriptive contact message.",
      honeypot: "bot-filled",
      formLoadTime: 123.45,
      unexpected: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const tree = z.treeifyError(result.error);
      expect(tree.properties?.honeypot?.errors?.[0]).toContain("Invalid submission");
      expect(tree.properties?.formLoadTime?.errors?.[0]).toContain("expected int");
      expect(tree.errors[0]).toContain("Unrecognized key");
    }
  });
});
