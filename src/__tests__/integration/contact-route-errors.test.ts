/**
 * @fileoverview Integration tests for /api/contact route error paths.
 */
/* @vitest-environment node */
import { describe, expect, it } from "vitest";

describe("/api/contact POST (errors)", () => {
  it("returns 400 for invalid JSON body", async () => {
    process.env.AWS_REGION = process.env.AWS_REGION || "us-east-1";
    process.env.CONTACT_EMAIL = process.env.CONTACT_EMAIL || "test@example.com";
    process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "example.com";
    const { POST } = await import("@/app/api/contact/route");
    const req = new Request("http://localhost/api/contact", { method: "POST", body: "not-json" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { code?: string };
    expect(data.code).toBe("INVALID_JSON");
  });

  it("returns 400 for schema validation failure", async () => {
    process.env.AWS_REGION = process.env.AWS_REGION || "us-east-1";
    process.env.CONTACT_EMAIL = process.env.CONTACT_EMAIL || "test@example.com";
    process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "example.com";
    const { POST } = await import("@/app/api/contact/route");
    const payload = { name: "A", email: "bad", message: "short" };
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { code?: string };
    expect(data.code).toBe("VALIDATION_ERROR");
  });
});
