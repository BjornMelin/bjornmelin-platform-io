import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "@/components/sections/hero";

describe("Hero", () => {
  it("renders the name heading", () => {
    render(<Hero />);

    expect(screen.getByRole("heading", { level: 1, name: /bjorn melin/i })).toBeInTheDocument();
  });

  it("renders the professional title", () => {
    render(<Hero />);

    expect(screen.getByText(/senior data scientist/i)).toBeInTheDocument();
    expect(screen.getByText(/cloud solutions architect/i)).toBeInTheDocument();
    expect(screen.getByText(/6x aws certified/i)).toBeInTheDocument();
  });

  it("renders the profile image with correct alt text", () => {
    render(<Hero />);

    const image = screen.getByRole("img", { name: /bjorn melin/i });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/headshot/headshot-2024.jpg");
  });

  it("renders 'Get in Touch' CTA with correct link", () => {
    render(<Hero />);

    const contactLink = screen.getByRole("link", { name: /get in touch/i });
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute("href", "/contact");
  });

  it("renders 'View Projects' CTA with correct link", () => {
    render(<Hero />);

    const projectsLink = screen.getByRole("link", { name: /view projects/i });
    expect(projectsLink).toBeInTheDocument();
    expect(projectsLink).toHaveAttribute("href", "/projects");
  });

  it("has section landmark for accessibility", () => {
    const { container } = render(<Hero />);

    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("renders CTA buttons with accessible styling", () => {
    render(<Hero />);

    const contactLink = screen.getByRole("link", { name: /get in touch/i });
    const projectsLink = screen.getByRole("link", { name: /view projects/i });

    // Both links should be visible and interactive
    expect(contactLink).toBeVisible();
    expect(projectsLink).toBeVisible();
  });
});
