import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "@/components/contact/contact-form";
import { server } from "@/mocks/node";

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

/**
 * Helper to fill the form with valid data and trigger validation.
 * Uses blur events since the form uses mode: "onTouched" validation.
 */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  const nameInput = screen.getByLabelText(/name/i);
  const emailInput = screen.getByLabelText(/email/i);
  const messageInput = screen.getByLabelText(/message/i);

  // Type and blur each field to trigger validation
  await user.type(nameInput, "John Doe");
  await user.tab(); // Blur name

  await user.type(emailInput, "john@example.com");
  await user.tab(); // Blur email

  await user.type(messageInput, "This is a test message that is long enough.");
  await user.tab(); // Blur message
}

describe("ContactForm", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3000/api");
    mockToast.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders form with name, email, message fields", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it("renders hidden honeypot field with tabIndex -1", () => {
    render(<ContactForm />);

    // The honeypot field should be in the document but hidden
    const honeypotInput = document.querySelector('input[name="honeypot"]');
    expect(honeypotInput).toBeInTheDocument();
    expect(honeypotInput).toHaveAttribute("tabIndex", "-1");
  });

  it("shows validation errors on blur for invalid name", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, "A"); // Too short (min 2 chars)
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it("shows validation errors on blur for invalid email", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, "not-an-email");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it("keeps submit enabled and shows validation errors on submit", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    const submitButton = screen.getByRole("button", { name: /send message/i });
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(await screen.findByText(/name must be/i)).toBeInTheDocument();
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(await screen.findByText(/message must be/i)).toBeInTheDocument();
  });

  it("submits form data to API endpoint", async () => {
    const user = userEvent.setup();
    let capturedRequest: { url: string; method: string; headers: Headers } | null = null;

    server.use(
      http.post("*/api/contact", ({ request }) => {
        capturedRequest = {
          url: request.url,
          method: request.method,
          headers: request.headers,
        };
        return HttpResponse.json({ success: true });
      }),
    );

    render(<ContactForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest?.url).toContain("/contact");
      expect(capturedRequest?.method).toBe("POST");
      expect(capturedRequest?.headers.get("Content-Type")).toBe("application/json");
    });
  });

  it("includes honeypot and formLoadTime in payload", async () => {
    const user = userEvent.setup();
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/contact", async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      }),
    );

    render(<ContactForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
      expect(capturedBody).toHaveProperty("honeypot");
      expect(capturedBody).toHaveProperty("formLoadTime");
      expect(typeof capturedBody?.formLoadTime).toBe("number");
    });
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();

    // Use an infinite delay to keep the request pending
    server.use(
      http.post("*/api/contact", async () => {
        await delay("infinite");
        return HttpResponse.json({ success: true });
      }),
    );

    render(<ContactForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: /send message/i }));

    // Should show loading state while fetch is pending
    await waitFor(() => {
      expect(screen.getByText(/sending/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
    });

    // Note: MSW cleanup is handled globally in src/test/setup.ts
  });

  it("shows success message on 200 response", async () => {
    const user = userEvent.setup();
    // Default handler returns success - no override needed

    render(<ContactForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error message on failure", async () => {
    const user = userEvent.setup();

    // Override with error response
    server.use(
      http.post("*/api/contact", () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      }),
    );

    render(<ContactForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
    });
  });

  it("resets form after successful submission", async () => {
    const user = userEvent.setup();
    // Default handler returns success - no override needed

    render(<ContactForm />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const messageInput = screen.getByLabelText(/message/i) as HTMLTextAreaElement;

    // Type and blur each field
    await user.type(nameInput, "John Doe");
    await user.tab();
    await user.type(emailInput, "john@example.com");
    await user.tab();
    await user.type(messageInput, "This is a test message that is long enough.");
    await user.tab();

    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(nameInput.value).toBe("");
      expect(emailInput.value).toBe("");
      expect(messageInput.value).toBe("");
    });
  });
});
