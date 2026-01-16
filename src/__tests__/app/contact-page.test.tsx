import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock ContactForm to avoid complex dependencies
vi.mock("@/components/contact/contact-form", () => ({
  ContactForm: () => <form data-testid="contact-form">Contact Form</form>,
}));

// Import after mocks
import ContactPage, { metadata } from "@/app/contact/page";

describe("ContactPage", () => {
  it("renders the page heading", () => {
    render(<ContactPage />);

    expect(screen.getByRole("heading", { level: 1, name: /contact me/i })).toBeInTheDocument();
  });

  it("renders introductory text", () => {
    render(<ContactPage />);

    expect(screen.getByText(/have a question/i)).toBeInTheDocument();
    expect(screen.getByText(/get back to you/i)).toBeInTheDocument();
  });

  it("renders the ContactForm component", () => {
    render(<ContactPage />);

    expect(screen.getByTestId("contact-form")).toBeInTheDocument();
  });
});

describe("ContactPage metadata", () => {
  it("exports metadata with correct title", () => {
    expect(metadata.title).toBe("Contact | Bjorn Melin");
  });

  it("exports metadata with description", () => {
    expect(metadata.description).toBe("Get in touch with me through this contact form.");
  });
});
