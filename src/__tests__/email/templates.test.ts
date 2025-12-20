/* @vitest-environment node */
import { describe, expect, it } from "vitest";
import { createContactEmailHtml, createContactEmailText } from "@/lib/email/templates/contact-form";

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
});
