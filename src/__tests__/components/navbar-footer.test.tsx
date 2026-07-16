/**
 * @fileoverview Smoke tests for Navbar and Footer components.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PROFILE } from "@/lib/profile";

describe("Navbar/Footer", () => {
  it("renders Navbar with basic links", () => {
    render(<Navbar />);
    expect(screen.getAllByRole("link", { name: /home/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /about/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /projects/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /agent skills/i }).length).toBeGreaterThan(0);
  });

  it("toggles the mobile menu", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const toggle = screen.getByLabelText(/toggle menu/i);
    expect(screen.queryByTestId("mobile-nav")).not.toBeInTheDocument();

    await user.click(toggle);
    expect(await screen.findByTestId("mobile-nav")).toBeInTheDocument();

    const close = screen.getByRole("button", { name: /close/i });
    await user.click(close);
    expect(screen.queryByTestId("mobile-nav")).not.toBeInTheDocument();
  });

  it("renders Footer with copyright text", () => {
    render(<Footer />);
    expect(screen.getByText(/bjorn melin/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      PROFILE.socialUrls.github,
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      PROFILE.socialUrls.linkedin,
    );
    expect(screen.getByRole("link", { name: "Medium" })).toHaveAttribute(
      "href",
      PROFILE.socialUrls.medium,
    );
    expect(screen.getByRole("link", { name: "ORCID" })).toHaveAttribute(
      "href",
      PROFILE.socialUrls.orcid,
    );
  });
});
