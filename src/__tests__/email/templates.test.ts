/* @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import {
  createContactEmailHtml,
  createContactEmailText,
  validateContactForm,
} from "@/lib/email/templates/contact-form";

describe("createContactEmailText", () => {
  const fixedDate = new Date("2024-01-01T12:00:00Z");

  it("includes name, email, and message", () => {
    const text = createContactEmailText({
      data: {
        name: "John Doe",
        email: "john@example.com",
        message: "Hello, this is a test message.",
      },
      submittedAt: fixedDate,
    });

    expect(text).toContain("Name: John Doe");
    expect(text).toContain("Email: john@example.com");
    expect(text).toContain("Hello, this is a test message.");
  });

  it("includes deterministic ISO timestamp", () => {
    const text = createContactEmailText({
      data: {
        name: "Test",
        email: "test@example.com",
        message: "Test message",
      },
      submittedAt: fixedDate,
    });

    expect(text).toContain("Submitted at: 2024-01-01T12:00:00.000Z");
  });

  it("uses the current time when submittedAt is missing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-02-01T09:30:00Z"));
    try {
      const text = createContactEmailText({
        data: {
          name: "Test",
          email: "test@example.com",
          message: "Test message",
        },
      });

      expect(text).toContain("Submitted at: 2024-02-01T09:30:00.000Z");
    } finally {
      vi.useRealTimers();
    }
  });

  it("preserves multiline messages", () => {
    const text = createContactEmailText({
      data: {
        name: "Test",
        email: "test@example.com",
        message: "Line 1\nLine 2\nLine 3",
      },
      submittedAt: fixedDate,
    });

    expect(text).toContain("Line 1\nLine 2\nLine 3");
  });
});

describe("createContactEmailHtml", () => {
  const fixedDate = new Date("2024-01-01T12:00:00Z");

  it("includes styled HTML structure", () => {
    const html = createContactEmailHtml({
      data: {
        name: "Test",
        email: "test@example.com",
        message: "Test message",
      },
      submittedAt: fixedDate,
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html>");
    expect(html).toContain("</html>");
    expect(html).toContain('class="container"');
    expect(html).toContain('class="header"');
  });

  it("escapes < to &lt;", () => {
    const html = createContactEmailHtml({
      data: {
        name: "Test <script>",
        email: "test@example.com",
        message: "Test",
      },
      submittedAt: fixedDate,
    });

    expect(html).toContain("Test &lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("escapes > to &gt;", () => {
    const html = createContactEmailHtml({
      data: {
        name: "Test",
        email: "test@example.com",
        message: "1 > 0",
      },
      submittedAt: fixedDate,
    });

    expect(html).toContain("1 &gt; 0");
  });

  it("escapes & to &amp;", () => {
    const html = createContactEmailHtml({
      data: {
        name: "Test & Company",
        email: "test@example.com",
        message: "Test",
      },
      submittedAt: fixedDate,
    });

    expect(html).toContain("Test &amp; Company");
  });

  it("converts newlines to <br> tags in message", () => {
    const html = createContactEmailHtml({
      data: {
        name: "Test",
        email: "test@example.com",
        message: "Line 1\nLine 2\nLine 3",
      },
      submittedAt: fixedDate,
    });

    expect(html).toContain("Line 1<br>Line 2<br>Line 3");
  });

  it("includes mailto link for email", () => {
    const html = createContactEmailHtml({
      data: {
        name: "Test",
        email: "john@example.com",
        message: "Test",
      },
      submittedAt: fixedDate,
    });

    expect(html).toContain('href="mailto:john@example.com"');
    expect(html).toContain(">john@example.com</a>");
  });

  it("includes deterministic ISO timestamp", () => {
    const html = createContactEmailHtml({
      data: {
        name: "Test",
        email: "test@example.com",
        message: "Test",
      },
      submittedAt: fixedDate,
    });

    expect(html).toContain("Submitted at: 2024-01-01T12:00:00.000Z");
  });

  it("uses the current time when submittedAt is missing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-02-01T09:30:00Z"));
    try {
      const html = createContactEmailHtml({
        data: {
          name: "Test",
          email: "test@example.com",
          message: "Test",
        },
      });

      expect(html).toContain("Submitted at: 2024-02-01T09:30:00.000Z");
    } finally {
      vi.useRealTimers();
    }
  });

  it("uses the provided domain when supplied", () => {
    const html = createContactEmailHtml({
      data: {
        name: "Test",
        email: "test@example.com",
        message: "Test message",
      },
      submittedAt: fixedDate,
      domain: "example.org",
    });

    expect(html).toContain("contact form on example.org");
  });

  it("escapes quotes", () => {
    const html = createContactEmailHtml({
      data: {
        name: 'Test "quoted"',
        email: "test@example.com",
        message: "Test",
      },
      submittedAt: fixedDate,
    });

    expect(html).toContain("Test &quot;quoted&quot;");
  });
});

describe("validateContactForm", () => {
  it("returns valid for well-formed input", () => {
    const result = validateContactForm({
      name: "John Doe",
      email: "john@example.com",
      message: "Hello there! This is valid.",
    });

    expect(result).toEqual({ valid: true });
  });

  it("rejects missing name", () => {
    expect(
      validateContactForm({
        email: "john@example.com",
        message: "Hello world!!",
      }),
    ).toEqual({
      valid: false,
      error: "Name must be at least 2 characters",
      field: "name",
    });
  });

  it("rejects short name after trimming", () => {
    const result = validateContactForm({
      name: " ",
      email: "john@example.com",
      message: "Hello world!!",
    });

    expect(result.valid).toBe(false);
    expect(result.field).toBe("name");
  });

  it("rejects long name", () => {
    const result = validateContactForm({
      name: "a".repeat(51),
      email: "john@example.com",
      message: "Hello world!!",
    });

    expect(result.valid).toBe(false);
    expect(result.field).toBe("name");
  });

  it("rejects name containing newlines", () => {
    const result = validateContactForm({
      name: "John\nDoe",
      email: "john@example.com",
      message: "Hello world!!",
    });

    expect(result).toEqual({
      valid: false,
      error: "Invalid name",
      field: "name",
    });
  });

  it("rejects missing email", () => {
    const result = validateContactForm({
      name: "John",
      message: "Hello world!!",
    });

    expect(result).toEqual({
      valid: false,
      error: "Invalid email address",
      field: "email",
    });
  });

  it("rejects invalid email", () => {
    const result = validateContactForm({
      name: "John",
      email: "not-an-email",
      message: "Hello world!!",
    });

    expect(result).toEqual({
      valid: false,
      error: "Invalid email address",
      field: "email",
    });
  });

  it("rejects email containing newlines", () => {
    const result = validateContactForm({
      name: "John",
      email: "john@example.com\nspam",
      message: "Hello world!!",
    });

    expect(result).toEqual({
      valid: false,
      error: "Invalid email address",
      field: "email",
    });
  });

  it("rejects missing message", () => {
    const result = validateContactForm({
      name: "John",
      email: "john@example.com",
    });

    expect(result).toEqual({
      valid: false,
      error: "Message must be at least 10 characters",
      field: "message",
    });
  });

  it("rejects short message after trimming", () => {
    const result = validateContactForm({
      name: "John",
      email: "john@example.com",
      message: "  short  ",
    });

    expect(result.valid).toBe(false);
    expect(result.field).toBe("message");
  });

  it("rejects long message", () => {
    const result = validateContactForm({
      name: "John",
      email: "john@example.com",
      message: "a".repeat(1001),
    });

    expect(result.valid).toBe(false);
    expect(result.field).toBe("message");
  });
});
