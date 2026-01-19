import { describe, expect, it } from "vitest";
import { z } from "zod";

import { contactFormSchema } from "@/lib/schemas/contact";

describe("contactFormSchema", () => {
  it("accepts valid contact submissions", () => {
    const payload = {
      name: "Valid Name",
      email: "valid@example.com",
      message: "This is a sufficiently descriptive contact message.",
    };

    expect(contactFormSchema.parse(payload)).toEqual(payload);
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
});
