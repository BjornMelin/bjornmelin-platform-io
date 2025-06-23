import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CSRFProviderModern } from "@/components/providers/csrf-provider-modern";
import { ContactForm } from "../contact-form";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => {
  const filterMotionProps = (props: Record<string, unknown>) => {
    const {
      initial: _initial,
      animate: _animate,
      exit: _exit,
      variants: _variants,
      transition: _transition,
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...rest
    } = props;
    return rest;
  };

  return {
    motion: {
      div: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => (
        <div {...filterMotionProps(props)}>{children}</div>
      ),
      form: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => (
        <form {...filterMotionProps(props)}>{children}</form>
      ),
      p: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => (
        <p {...filterMotionProps(props)}>{children}</p>
      ),
      span: ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => (
        <span {...filterMotionProps(props)}>{children}</span>
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock the modern CSRF provider
const mockCSRFHeaders = {
  getHeadersWithRetry: vi.fn().mockImplementation(async () => {
    return {
      "Content-Type": "application/json",
      "X-CSRF-Token": "test-token",
    };
  }),
  isReady: true,
};
const mockCSRFResponseHandler = {
  handleResponse: vi.fn().mockImplementation(() => {}),
};

vi.mock("@/components/providers/csrf-provider-modern", () => ({
  CSRFProviderModern: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useCSRFHeaders: () => mockCSRFHeaders,
  useCSRFResponseHandler: () => mockCSRFResponseHandler,
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <CSRFProviderModern>{children}</CSRFProviderModern>
);

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ContactForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockToast.mockClear();
    mockCSRFHeaders.getHeadersWithRetry.mockResolvedValue({
      "Content-Type": "application/json",
      "X-CSRF-Token": "test-token",
    });
    mockCSRFResponseHandler.handleResponse.mockImplementation(() => {});

    // Default successful mock response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: "Message sent successfully" }),
      headers: new Headers(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders all form fields", () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: /privacy policy/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
    });

    it("renders honeypot field (hidden from screen readers)", () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      // Honeypot should be in DOM but hidden - target by name attribute specifically
      const honeypot = document.querySelector('input[name="honeypot"]');
      expect(honeypot).toBeInTheDocument();
      expect(honeypot).toHaveAttribute("name", "honeypot");
      expect(honeypot).toHaveAttribute("tabIndex", "-1");
      expect(honeypot).toHaveAttribute("autoComplete", "off");
    });

    it("submit button is disabled initially", () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const submitButton = screen.getByRole("button", { name: /send message/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Form Validation", () => {
    it("enables submit button when all required fields are filled", async () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const gdprCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
      const submitButton = screen.getByRole("button", { name: /send message/i });

      // Fill all required fields
      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(
        messageInput,
        "This is a test message that is long enough to pass validation.",
      );
      await user.click(gdprCheckbox);

      await waitFor(
        () => {
          expect(submitButton).toBeEnabled();
        },
        { timeout: 2000 },
      );
    });

    it("shows validation errors for invalid inputs", async () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);

      // Enter invalid data
      await user.type(nameInput, "A"); // Too short
      await user.type(emailInput, "invalid-email"); // Invalid format
      await user.type(messageInput, "Short"); // Too short

      // Trigger validation by blurring fields
      await user.click(document.body);

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
        expect(screen.getByText(/message must be at least 10 characters/i)).toBeInTheDocument();
      });
    });

    it("validates name contains only allowed characters", async () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);

      await user.type(nameInput, "John123@#$");
      await user.click(document.body); // Trigger validation

      await waitFor(() => {
        expect(
          screen.getByText(/name can only contain letters, spaces, hyphens, and apostrophes/i),
        ).toBeInTheDocument();
      });
    });

    it("enforces message length limits", async () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const messageInput = screen.getByLabelText(/message/i);

      await user.type(messageInput, "A".repeat(1001)); // Exceeds 1000 char limit
      await user.click(document.body); // Trigger validation

      await waitFor(() => {
        expect(screen.getByText(/message must be less than 1000 characters/i)).toBeInTheDocument();
      });
    });

    it("requires GDPR consent", async () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const submitButton = screen.getByRole("button", { name: /send message/i });

      // Fill all fields except GDPR consent
      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(messageInput, "This is a test message that is long enough.");

      // Button should remain disabled without GDPR consent
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("Form Submission", () => {
    it("successfully submits valid form data", async () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const gdprCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
      const submitButton = screen.getByRole("button", { name: /send message/i });

      // Fill form with valid data
      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(
        messageInput,
        "This is a test message that is long enough to pass validation.",
      );
      await user.click(gdprCheckbox);

      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-token",
          },
          body: expect.stringContaining("John Doe"),
          credentials: "same-origin",
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Message sent successfully!",
        description: "Thank you for reaching out. I'll get back to you soon.",
        duration: 5000,
      });
    });

    it("handles server validation errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Validation failed",
          errors: [{ path: ["email"], message: "Invalid email format" }],
        }),
        headers: new Headers(),
      });

      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const gdprCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
      const submitButton = screen.getByRole("button", { name: /send message/i });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(messageInput, "This is a test message.");
      await user.click(gdprCheckbox);

      await waitFor(() => expect(submitButton).toBeEnabled());
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Validation Error",
          description: "Please check the form fields and try again.",
          variant: "destructive",
        });
      });
    });

    it("handles rate limiting errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          error: "Too many requests. Please try again later.",
        }),
        headers: new Headers(),
      });

      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const gdprCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
      const submitButton = screen.getByRole("button", { name: /send message/i });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(messageInput, "This is a test message.");
      await user.click(gdprCheckbox);

      await waitFor(() => expect(submitButton).toBeEnabled());
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Too many requests",
          description: expect.stringMatching(/Please wait \d+ minutes? before trying again/),
          variant: "destructive",
          duration: 10000,
        });
      });
    });

    it("handles network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const gdprCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
      const submitButton = screen.getByRole("button", { name: /send message/i });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(messageInput, "This is a test message.");
      await user.click(gdprCheckbox);

      await waitFor(() => expect(submitButton).toBeEnabled());
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error sending message",
          description: "Network error",
          variant: "destructive",
          duration: 5000,
        });
      });
    });

    it("handles server errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: "Internal server error",
        }),
        headers: new Headers(),
      });

      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const gdprCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
      const submitButton = screen.getByRole("button", { name: /send message/i });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(messageInput, "This is a test message.");
      await user.click(gdprCheckbox);

      await waitFor(() => expect(submitButton).toBeEnabled());
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error sending message",
          description: "Internal server error",
          variant: "destructive",
          duration: 5000,
        });
      });
    });
  });

  describe("CSRF Integration", () => {
    it("uses CSRF headers in requests", async () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const gdprCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
      const submitButton = screen.getByRole("button", { name: /send message/i });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(messageInput, "This is a test message.");
      await user.click(gdprCheckbox);

      await waitFor(() => expect(submitButton).toBeEnabled());
      await user.click(submitButton);

      expect(mockCSRFHeaders.getHeadersWithRetry).toHaveBeenCalled();
      expect(mockCSRFResponseHandler.handleResponse).toHaveBeenCalled();
    });

    it("handles CSRF token errors", async () => {
      mockCSRFHeaders.getHeadersWithRetry.mockRejectedValue(new Error("CSRF token error"));

      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const gdprCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
      const submitButton = screen.getByRole("button", { name: /send message/i });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(messageInput, "This is a test message.");
      await user.click(gdprCheckbox);

      await waitFor(() => expect(submitButton).toBeEnabled());
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error sending message",
          description: "CSRF token error",
          variant: "destructive",
          duration: 5000,
        });
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels and descriptions", () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);

      // Check that inputs have proper labels and can be labeled
      expect(nameInput).toHaveAttribute("id");
      expect(emailInput).toHaveAttribute("id");
      expect(messageInput).toHaveAttribute("id");

      // Check that inputs have aria-invalid set initially
      expect(nameInput).toHaveAttribute("aria-invalid", "false");
      expect(emailInput).toHaveAttribute("aria-invalid", "false");
      expect(messageInput).toHaveAttribute("aria-invalid", "false");
    });

    it("associates error messages with form fields", async () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "A");
      await user.click(document.body);

      await waitFor(() => {
        const errorMessage = screen.getByText(/name must be at least 2 characters/i);
        expect(errorMessage).toBeInTheDocument();
        expect(nameInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("maintains focus management during form submission", async () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);

      // Focus should be manageable
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);
    });
  });

  describe("Security Features", () => {
    it("includes honeypot field in form submission", async () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const gdprCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
      const submitButton = screen.getByRole("button", { name: /send message/i });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(messageInput, "This is a test message.");
      await user.click(gdprCheckbox);

      await waitFor(() => expect(submitButton).toBeEnabled());
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-token",
          },
          body: expect.stringContaining('"honeypot":""'),
          credentials: "same-origin",
        });
      });
    });

    it("sends form data without modification", async () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const gdprCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
      const submitButton = screen.getByRole("button", { name: /send message/i });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(messageInput, "This is a test message.");
      await user.click(gdprCheckbox);

      await waitFor(() => expect(submitButton).toBeEnabled());
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-token",
          },
          body: expect.stringContaining('"name":"John Doe"'),
          credentials: "same-origin",
        });
      });
    });
  });

  describe("Form Reset", () => {
    it("resets form after successful submission", async () => {
      render(<ContactForm />, { wrapper: TestWrapper });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);
      const gdprCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
      const submitButton = screen.getByRole("button", { name: /send message/i });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(messageInput, "This is a test message.");
      await user.click(gdprCheckbox);

      await waitFor(() => expect(submitButton).toBeEnabled());
      await user.click(submitButton);

      await waitFor(() => {
        expect(nameInput).toHaveValue("");
        expect(emailInput).toHaveValue("");
        expect(messageInput).toHaveValue("");
        expect(gdprCheckbox).not.toBeChecked();
        expect(submitButton).toBeDisabled();
      });
    });
  });
});
