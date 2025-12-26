/**
 * @fileoverview Integration tests for /api/contact route error paths.
 */
/* @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { suppressConsoleError } from "@/test/helpers/console";

const mockCheckRateLimit = vi.fn(() => true);

// Mock email module (hoisted)
vi.mock("@/lib/email", () => ({
  sendContactEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/security", async () => {
  const actual = await vi.importActual<typeof import("@/lib/security")>("@/lib/security");
  return {
    ...actual,
    checkRateLimit: mockCheckRateLimit,
  };
});

describe("/api/contact POST (errors)", () => {
  let restoreConsole: () => void;

  beforeEach(() => {
    restoreConsole = suppressConsoleError();
    mockCheckRateLimit.mockReset().mockReturnValue(true);

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

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockReturnValue(false);
    const { POST } = await import("@/app/api/contact/route");

    const req = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.5",
      },
      body: JSON.stringify({
        name: "Valid Name",
        email: "test@example.com",
        message: "This is a valid message long enough to pass validation.",
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toMatch(/too many requests/i);
  });
});
