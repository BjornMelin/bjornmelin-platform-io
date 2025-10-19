/**
 * @fileoverview Smoke tests for Navbar and Footer components.
 */
import { render, screen } from "@testing-library/react";
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

  it("renders Footer with copyright text", () => {
    render(<Footer />);
    expect(screen.getByText(/bjorn melin/i)).toBeInTheDocument();
  });
});
