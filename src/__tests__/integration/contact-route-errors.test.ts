/**
 * @fileoverview Integration tests for /api/contact route error paths.
 */
/* @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { suppressConsoleError } from "@/test/helpers/console";

// Mock email module (hoisted)
vi.mock("@/lib/email", () => ({
  sendContactEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("/api/contact POST (errors)", () => {
  let restoreConsole: () => void;

  beforeEach(() => {
    restoreConsole = suppressConsoleError();

    // Ensure required env vars are set
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.stubEnv("CONTACT_EMAIL", "test@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "example.com");
  });

  afterEach(() => {
    restoreConsole();
    vi.unstubAllEnvs();
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/contact/route");

    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      body: "not-json",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = (await res.json()) as { code?: string };
    expect(data.code).toBe("INVALID_JSON");
  });

  it("returns 400 for schema validation failure", async () => {
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
