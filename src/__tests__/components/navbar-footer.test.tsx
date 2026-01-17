/**
 * @fileoverview Smoke tests for Navbar and Footer components.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

describe("Navbar/Footer", () => {
  it("renders Navbar with basic links", () => {
    render(<Navbar />);
    expect(screen.getAllByRole("link", { name: /home/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /about/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /projects/i }).length).toBeGreaterThan(0);
  });

  it("toggles the mobile menu", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const toggle = screen.getByLabelText(/toggle menu/i);
    const details = toggle.closest("details");
    expect(details).not.toHaveAttribute("open");

    await user.click(toggle);
    expect(details).toHaveAttribute("open");

    await user.click(toggle);
    expect(details).not.toHaveAttribute("open");
  });

  it("renders Footer with copyright text", () => {
    render(<Footer />);
    expect(screen.getByText(/bjorn melin/i)).toBeInTheDocument();
  });
});
