/* @vitest-environment node */
import { describe, it, expect, vi } from "vitest";

describe("POST /api/contact (integration)", () => {
  it("returns 200 on valid payload when EmailService succeeds", async () => {
    vi.resetModules();
    const sendSpy = vi.fn().mockResolvedValue(undefined);
    vi.doMock("@/lib/services/email", () => ({
      EmailService: class {
        static getInstance() { return new this(); }
        async sendContactFormEmail() { return sendSpy(); }
      },
    }));

    const { POST } = await import("@/app/api/contact/route");
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Alice", email: "a@example.com", message: "Hello world!!!" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(sendSpy).toHaveBeenCalledOnce();
  });
});

