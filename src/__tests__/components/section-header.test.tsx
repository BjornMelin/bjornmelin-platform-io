import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionHeader } from "@/components/shared/section-header";

describe("SectionHeader", () => {
  it("renders title as h2 heading", () => {
    render(<SectionHeader title="Test Title" />);

    expect(screen.getByRole("heading", { level: 2, name: "Test Title" })).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<SectionHeader title="Title" description="Test description text" />);

    expect(screen.getByText("Test description text")).toBeInTheDocument();
  });

  it("does not render description paragraph when not provided", () => {
    const { container } = render(<SectionHeader title="Title" />);

    // Should only have the heading, no paragraph
    expect(container.querySelector("p")).not.toBeInTheDocument();
  });

  it("defaults to center alignment", () => {
    const { container } = render(<SectionHeader title="Title" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("text-center");
  });

  it("applies left alignment when specified", () => {
    const { container } = render(<SectionHeader title="Title" alignment="left" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("text-left");
  });

  it("applies right alignment when specified", () => {
    const { container } = render(<SectionHeader title="Title" alignment="right" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("text-right");
  });

  it("applies proper styling classes", () => {
    const { container } = render(<SectionHeader title="Title" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("max-w-3xl", "mx-auto", "mb-12");
  });

  it("renders title with proper heading styles", () => {
    render(<SectionHeader title="Styled Title" />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveClass("text-3xl", "font-bold");
  });

  it("renders description with muted styling", () => {
    render(<SectionHeader title="Title" description="Muted description" />);

    const description = screen.getByText("Muted description");
    expect(description).toHaveClass("text-muted-foreground");
  });
});
