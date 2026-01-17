import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TechBadge } from "@/components/shared/tech-badge";

describe("TechBadge", () => {
  const getBadge = (label: string) => {
    const text = screen.getByText(label);
    const badge = text.parentElement;
    if (!badge) {
      throw new Error("TechBadge wrapper not found");
    }
    return badge;
  };

  it("renders the technology name", () => {
    render(<TechBadge name="TypeScript" />);

    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("defaults to medium size", () => {
    render(<TechBadge name="React" />);

    const badge = getBadge("React");
    expect(badge).toHaveClass("text-xs", "px-2.5", "py-0.5");
  });

  it("applies small size classes when size is sm", () => {
    render(<TechBadge name="Node.js" size="sm" />);

    const badge = getBadge("Node.js");
    expect(badge).toHaveClass("text-[11px]", "px-2", "py-0.5");
  });

  it("applies large size classes when size is lg", () => {
    render(<TechBadge name="AWS" size="lg" />);

    const badge = getBadge("AWS");
    expect(badge).toHaveClass("text-sm", "px-3", "py-1");
  });

  it("applies base styling classes", () => {
    render(<TechBadge name="Python" />);

    const badge = getBadge("Python");
    expect(badge).toHaveClass("inline-flex", "items-center", "rounded-full", "font-medium");
  });

  it("applies primary color classes", () => {
    render(<TechBadge name="Docker" />);

    const badge = getBadge("Docker");
    expect(badge).toHaveClass("text-foreground/80", "bg-muted/70");
  });

  it("applies custom className when provided", () => {
    render(<TechBadge name="Kubernetes" className="custom-class" />);

    const badge = getBadge("Kubernetes");
    expect(badge).toHaveClass("custom-class");
  });

  it("renders as a span element", () => {
    render(<TechBadge name="Next.js" />);

    const badge = getBadge("Next.js");
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

    expect(getBadge("React")).toHaveClass("text-[11px]");
    expect(getBadge("TypeScript")).toHaveClass("text-xs");
    expect(getBadge("Node.js")).toHaveClass("text-sm");
  });
});
