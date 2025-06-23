import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CSRFProvider } from "@/components/providers/csrf-provider";
import { ContactFormEnhanced } from "../contact-form-enhanced";

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock fetch
global.fetch = vi.fn();

// Test wrapper with CSRFProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <CSRFProvider>{children}</CSRFProvider>
);

const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};

describe("ContactFormEnhanced", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
    // Mock CSRF token endpoint
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "X-CSRF-Token": "test-csrf-token" }),
      json: async () => ({ message: "CSRF token provided in X-CSRF-Token header" }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all form fields correctly", () => {
    renderWithProviders(<ContactFormEnhanced />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByText(/I agree to the/i)).toBeInTheDocument();
    expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    renderWithProviders(<ContactFormEnhanced />);

    const submitButton = screen.getByRole("button", { name: /send message/i });

    // Button should be disabled initially
    expect(submitButton).toBeDisabled();

    // Try to submit with empty fields
    await user.type(screen.getByLabelText(/name/i), "J");
    await user.clear(screen.getByLabelText(/name/i));

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it("enables submit button when all required fields are filled", async () => {
    renderWithProviders(<ContactFormEnhanced />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messageInput = screen.getByLabelText(/message/i);
    const gdprCheckbox = screen.getByRole("checkbox");
    const submitButton = screen.getByRole("button", { name: /send message/i });

    // Initially disabled
    expect(submitButton).toBeDisabled();

    // Fill out the form
    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(messageInput, "This is a test message for the contact form");
    await user.click(gdprCheckbox);

    // Button should now be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("validates email format", async () => {
    renderWithProviders(<ContactFormEnhanced />);

    const emailInput = screen.getByLabelText(/email/i);

    await user.type(emailInput, "invalid-email");
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    await user.clear(emailInput);
    await user.type(emailInput, "valid@email.com");

    await waitFor(() => {
      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
    });
  });

  it("validates name format", async () => {
    renderWithProviders(<ContactFormEnhanced />);

    const nameInput = screen.getByLabelText(/name/i);

    await user.type(nameInput, "123456");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/name can only contain letters/i)).toBeInTheDocument();
    });

    await user.clear(nameInput);
    await user.type(nameInput, "John O'Brien-Smith");

    await waitFor(() => {
      expect(screen.queryByText(/name can only contain letters/i)).not.toBeInTheDocument();
    });
  });

  it("shows character count for message field", async () => {
    renderWithProviders(<ContactFormEnhanced />);

    const messageInput = screen.getByLabelText(/message/i);

    expect(screen.getByText("0 / 1000")).toBeInTheDocument();

    await user.type(messageInput, "Hello, this is a test message!");

    await waitFor(() => {
      expect(screen.getByText("30 / 1000")).toBeInTheDocument();
    });
  });

  it.skip("submits form successfully with valid data", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
      headers: new Headers(),
    });

    renderWithProviders(<ContactFormEnhanced />);

    // Fill out the form
    await user.type(screen.getByLabelText(/name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(
      screen.getByLabelText(/message/i),
      "This is a test message for the contact form",
    );
    await user.click(screen.getByRole("checkbox"));

    const submitButton = screen.getByRole("button", { name: /send message/i });

    // Start the form submission
    const clickPromise = user.click(submitButton);

    // Check loading state immediately
    await waitFor(() => {
      expect(screen.getByText(/sending/i)).toBeInTheDocument();
    });

    // Wait for click to complete
    await clickPromise;

    // Wait for success message
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Message sent successfully!",
          description: expect.stringContaining("Thank you"),
        }),
      );
    });

    // Check fetch was called with correct data
    expect(global.fetch).toHaveBeenCalledWith("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "John Doe",
        email: "john@example.com",
        message: "This is a test message for the contact form",
        honeypot: "",
        gdprConsent: true,
      }),
    });

    // Form should be reset
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue("");
      expect(screen.getByLabelText(/email/i)).toHaveValue("");
      expect(screen.getByLabelText(/message/i)).toHaveValue("");
    });
  });

  it("handles rate limiting errors", async () => {
    const resetTime = Math.floor(Date.now() / 1000) + 900; // 15 minutes from now

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        error: "Too many requests",
        code: "RATE_LIMIT_EXCEEDED",
      }),
      headers: new Headers({
        "X-RateLimit-Reset": resetTime.toString(),
      }),
    });

    renderWithProviders(<ContactFormEnhanced />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/message/i), "This is a test message");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /send message/i }));

    // Should show rate limit error
    await waitFor(
      () => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Too many requests",
            description: expect.stringMatching(/please wait \d+ minute/i),
            variant: "destructive",
          }),
        );
      },
      { timeout: 5000 },
    );
  });

  it("handles server errors", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: "Internal server error",
      }),
      headers: new Headers(),
    });

    renderWithProviders(<ContactFormEnhanced />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/message/i), "This is a test message");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /send message/i }));

    // Should show error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error sending message",
          description: "Internal server error",
          variant: "destructive",
        }),
      );
    });
  });

  it("handles network errors", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

    renderWithProviders(<ContactFormEnhanced />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/message/i), "This is a test message");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /send message/i }));

    // Should show error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error sending message",
          description: "Network error",
          variant: "destructive",
        }),
      );
    });
  });

  it("honeypot field is hidden and functional", async () => {
    renderWithProviders(<ContactFormEnhanced />);

    // Honeypot field should not be visible
    const honeypotLabel = screen.getByText("Leave this field empty");
    expect(honeypotLabel.parentElement).toHaveClass("sr-only");

    // The input should have negative tabIndex
    const honeypotInput = screen.getByLabelText("Leave this field empty");
    expect(honeypotInput).toHaveAttribute("tabIndex", "-1");
    expect(honeypotInput).toHaveAttribute("autoComplete", "off");
  });

  it.skip("shows success animation after successful submission", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
      headers: new Headers(),
    });

    renderWithProviders(<ContactFormEnhanced />);

    // Fill and submit form
    await user.type(screen.getByLabelText(/name/i), "John Doe");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/message/i), "This is a test message");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /send message/i }));

    // Check for success message
    await waitFor(
      () => {
        expect(screen.getByText("Thank You!")).toBeInTheDocument();
        expect(screen.getByText(/your message has been sent successfully/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it.skip("provides proper ARIA attributes for accessibility", () => {
    renderWithProviders(<ContactFormEnhanced />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messageInput = screen.getByLabelText(/message/i);
    const form = screen.getByRole("form");

    expect(form).toHaveAttribute("aria-label", "Contact form");
    expect(form).toHaveAttribute("noValidate");

    // Inputs should have proper ARIA attributes when invalid
    expect(nameInput).not.toHaveAttribute("aria-invalid");
    expect(emailInput).not.toHaveAttribute("aria-invalid");
    expect(messageInput).not.toHaveAttribute("aria-invalid");
  });

  it.skip("focuses on first error field when validation fails", async () => {
    renderWithProviders(<ContactFormEnhanced />);

    // Fill only email (skip name)
    await user.type(screen.getByLabelText(/email/i), "john@example.com");

    // Try to continue with message
    const messageInput = screen.getByLabelText(/message/i);
    await user.click(messageInput);

    // Name field should receive focus due to error
    await waitFor(() => {
      const nameInput = screen.getByLabelText(/name/i);
      expect(document.activeElement).toBe(nameInput);
    });
  });

  it.skip("shows field-specific animations on errors", async () => {
    renderWithProviders(<ContactFormEnhanced />);

    const nameInput = screen.getByLabelText(/name/i);

    // Type invalid name
    await user.type(nameInput, "A");
    await user.tab();

    // Check for error message with animation
    await waitFor(() => {
      const errorMessage = screen.getByText(/name must be at least 2 characters/i);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute("role", "alert");
    });
  });
});
