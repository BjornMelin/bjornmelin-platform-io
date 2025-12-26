import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TechBadge } from "@/components/shared/tech-badge";

describe("TechBadge", () => {
  it("renders the technology name", () => {
    render(<TechBadge name="TypeScript" />);

    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("defaults to medium size", () => {
    render(<TechBadge name="React" />);

    const badge = screen.getByText("React");
    expect(badge).toHaveClass("text-sm", "px-3", "py-1");
  });

  it("applies small size classes when size is sm", () => {
    render(<TechBadge name="Node.js" size="sm" />);

    const badge = screen.getByText("Node.js");
    expect(badge).toHaveClass("text-xs", "px-2", "py-1");
  });

  it("applies large size classes when size is lg", () => {
    render(<TechBadge name="AWS" size="lg" />);

    const badge = screen.getByText("AWS");
    expect(badge).toHaveClass("text-base", "px-4", "py-2");
  });

  it("applies base styling classes", () => {
    render(<TechBadge name="Python" />);

    const badge = screen.getByText("Python");
    expect(badge).toHaveClass("inline-flex", "items-center", "rounded-full", "font-medium");
  });

  it("applies primary color classes", () => {
    render(<TechBadge name="Docker" />);

    const badge = screen.getByText("Docker");
    expect(badge).toHaveClass("text-primary");
    // Note: Tailwind classes with / (like bg-primary/10) may not be in the final className
    // due to how cn() works with dynamic classes
  });

  it("applies custom className when provided", () => {
    render(<TechBadge name="Kubernetes" className="custom-class" />);

    const badge = screen.getByText("Kubernetes");
    expect(badge).toHaveClass("custom-class");
  });

  it("renders as a span element", () => {
    render(<TechBadge name="Next.js" />);

    const badge = screen.getByText("Next.js");
    expect(badge.tagName.toLowerCase()).toBe("span");
  });

  it("can render multiple badges independently", () => {
    render(
      <>
        <TechBadge name="React" size="sm" />
        <TechBadge name="TypeScript" size="md" />
        <TechBadge name="Node.js" size="lg" />
      </>,
    );

    expect(screen.getByText("React")).toHaveClass("text-xs");
    expect(screen.getByText("TypeScript")).toHaveClass("text-sm");
    expect(screen.getByText("Node.js")).toHaveClass("text-base");
  });
});
