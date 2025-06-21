import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "../contact-form";

// Mock the useToast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ContactForm", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000/api";
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = "test@example.com";
  });

  it("should render all form fields", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByText(/i agree to the processing of my personal data/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });

  it("should have submit button enabled when all fields are valid", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    const submitButton = screen.getByRole("button", { name: /send message/i });
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messageInput = screen.getByLabelText(/message/i);
    const gdprCheckbox = screen.getByRole("checkbox");

    // Initially button should be disabled
    expect(submitButton).toBeDisabled();

    // Fill in valid data
    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(messageInput, "This is a test message that is long enough");
    await user.click(gdprCheckbox);

    // Button should be enabled after filling all fields with valid data
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("should show validation errors for invalid fields", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messageInput = screen.getByLabelText(/message/i);

    // Type invalid data
    await user.type(nameInput, "J"); // Too short
    await user.tab(); // Blur to trigger validation

    await user.type(emailInput, "invalid-email");
    await user.tab();

    await user.type(messageInput, "Short"); // Too short
    await user.tab();

    // Check for error messages
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/message must be at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it("should submit form successfully with valid data", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ContactForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messageInput = screen.getByLabelText(/message/i);
    const gdprCheckbox = screen.getByRole("checkbox");
    const submitButton = screen.getByRole("button", { name: /send message/i });

    // Fill in valid data
    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(messageInput, "This is a test message that is long enough");
    await user.click(gdprCheckbox);

    // Submit form
    await user.click(submitButton);

    // Check fetch was called with correct data
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/contact",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            message: "This is a test message that is long enough",
            honeypot: "",
            gdprConsent: true,
          }),
        }),
      );
    });

    // Check success message is shown
    await waitFor(() => {
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
    });

    // Check form is reset
    expect(nameInput).toHaveValue("");
    expect(emailInput).toHaveValue("");
    expect(messageInput).toHaveValue("");
    expect(gdprCheckbox).not.toBeChecked();
  });

  it("should handle submission errors", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    });

    render(<ContactForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messageInput = screen.getByLabelText(/message/i);
    const gdprCheckbox = screen.getByRole("checkbox");
    const submitButton = screen.getByRole("button", { name: /send message/i });

    // Fill in valid data
    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(messageInput, "This is a test message that is long enough");
    await user.click(gdprCheckbox);

    // Submit form
    await user.click(submitButton);

    // Check error message is shown
    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
    });
  });

  it("should disable form during submission", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<ContactForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messageInput = screen.getByLabelText(/message/i);
    const gdprCheckbox = screen.getByRole("checkbox");
    const submitButton = screen.getByRole("button", { name: /send message/i });

    // Fill in valid data
    await user.type(nameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(messageInput, "This is a test message that is long enough");
    await user.click(gdprCheckbox);

    // Submit form
    await user.click(submitButton);

    // Check inputs and button are disabled during submission
    expect(nameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(messageInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/sending.../i)).toBeInTheDocument();
  });
});
