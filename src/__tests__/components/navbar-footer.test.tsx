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
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /projects/i })).toBeInTheDocument();
  });

  it("toggles the mobile menu", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const toggle = screen.getByRole("button", { name: /toggle menu/i });
    expect(toggle).toBeInTheDocument();

    const contactBefore = screen.getAllByRole("link", { name: "Contact" });
    expect(contactBefore).toHaveLength(1);

    await user.click(toggle);
    const contactOpen = screen.getAllByRole("link", { name: "Contact" });
    expect(contactOpen.length).toBeGreaterThan(contactBefore.length);

    await user.click(toggle);
    const contactAfter = screen.getAllByRole("link", { name: "Contact" });
    expect(contactAfter).toHaveLength(1);
  });

  it("renders Footer with copyright text", () => {
    render(<Footer />);
    expect(screen.getByText(/bjorn melin/i)).toBeInTheDocument();
  });
});
