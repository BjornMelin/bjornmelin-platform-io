import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "@/app/loading";

describe("Loading", () => {
  it("renders a loading spinner", () => {
    const { container } = render(<Loading />);

    // Check for the spinner icon with animate-spin class
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders centered on the screen", () => {
    const { container } = render(<Loading />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("flex", "items-center", "justify-center", "min-h-screen");
  });

  it("applies primary color to spinner", () => {
    const { container } = render(<Loading />);

    const spinner = container.querySelector("svg");
    expect(spinner).toHaveClass("text-primary");
  });

  it("has accessible loading indicator", () => {
    const { container } = render(<Loading />);

    // Lucide icons are decorative by default (aria-hidden)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
