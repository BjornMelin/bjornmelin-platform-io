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

  it("closes the mobile menu when a mobile link is clicked", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const toggle = screen.getByRole("button", { name: /toggle menu/i });
    await user.click(toggle);

    const projectsLinks = screen.getAllByRole("link", { name: "Projects" });
    expect(projectsLinks.length).toBeGreaterThan(1);

    await user.click(projectsLinks[1]);

    const contactLinks = screen.getAllByRole("link", { name: "Contact" });
    expect(contactLinks).toHaveLength(1);
  });

  it("closes the mobile menu when home and contact links are clicked", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const toggle = screen.getByRole("button", { name: /toggle menu/i });
    await user.click(toggle);

    const homeLinks = screen.getAllByRole("link", { name: "Home" });
    expect(homeLinks.length).toBeGreaterThan(1);
    await user.click(homeLinks[1]);

    expect(screen.getAllByRole("link", { name: "Contact" })).toHaveLength(1);

    await user.click(toggle);
    const aboutLinks = screen.getAllByRole("link", { name: "About" });
    expect(aboutLinks.length).toBeGreaterThan(1);
    await user.click(aboutLinks[1]);

    expect(screen.getAllByRole("link", { name: "Contact" })).toHaveLength(1);

    await user.click(toggle);
    const contactLinks = screen.getAllByRole("link", { name: "Contact" });
    expect(contactLinks.length).toBeGreaterThan(1);
    await user.click(contactLinks[1]);

    expect(screen.getAllByRole("link", { name: "Contact" })).toHaveLength(1);
  });

  it("renders Footer with copyright text", () => {
    render(<Footer />);
    expect(screen.getByText(/bjorn melin/i)).toBeInTheDocument();
  });
});
