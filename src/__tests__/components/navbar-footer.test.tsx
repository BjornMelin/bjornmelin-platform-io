/**
 * @fileoverview Smoke tests for Navbar and Footer components.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
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

    expect(screen.queryByTestId("mobile-nav")).not.toBeInTheDocument();

    await user.click(toggle);
    expect(screen.getByTestId("mobile-nav")).toBeInTheDocument();

    await user.click(toggle);
    await waitFor(() => {
      expect(screen.queryByTestId("mobile-nav")).not.toBeInTheDocument();
    });
  });

  it("closes the mobile menu when a mobile link is clicked", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const toggle = screen.getByRole("button", { name: /toggle menu/i });
    await user.click(toggle);

    const mobileMenu = screen.getByTestId("mobile-nav");
    await user.click(within(mobileMenu).getByRole("link", { name: "Projects" }));

    await waitFor(() => {
      expect(screen.queryByTestId("mobile-nav")).not.toBeInTheDocument();
    });
  });

  it("closes the mobile menu when home and contact links are clicked", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const toggle = screen.getByRole("button", { name: /toggle menu/i });
    await user.click(toggle);

    const mobileMenu = screen.getByTestId("mobile-nav");
    await user.click(within(mobileMenu).getByRole("link", { name: "Home" }));

    await waitFor(() => {
      expect(screen.queryByTestId("mobile-nav")).not.toBeInTheDocument();
    });

    await user.click(toggle);
    const mobileMenuAfterHome = screen.getByTestId("mobile-nav");
    await user.click(within(mobileMenuAfterHome).getByRole("link", { name: "About" }));

    await waitFor(() => {
      expect(screen.queryByTestId("mobile-nav")).not.toBeInTheDocument();
    });

    await user.click(toggle);
    const mobileMenuAfterAbout = screen.getByTestId("mobile-nav");
    await user.click(within(mobileMenuAfterAbout).getByRole("link", { name: "Contact" }));

    await waitFor(() => {
      expect(screen.queryByTestId("mobile-nav")).not.toBeInTheDocument();
    });
  });

  it("renders Footer with copyright text", () => {
    render(<Footer />);
    expect(screen.getByText(/bjorn melin/i)).toBeInTheDocument();
  });
});
