import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock AboutDetail component
vi.mock("@/components/sections/about-detail", () => ({
  AboutDetail: () => (
    <section data-testid="about-detail">
      <h1>About Me</h1>
      <p>About detail content</p>
    </section>
  ),
}));

// Import after mocks
import AboutPage, { metadata } from "@/app/about/page";

describe("AboutPage", () => {
  it("renders AboutDetail component", () => {
    render(<AboutPage />);

    expect(screen.getByTestId("about-detail")).toBeInTheDocument();
  });

  it("has main landmark for accessibility", () => {
    render(<AboutPage />);

    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("contains AboutDetail inside main", () => {
    render(<AboutPage />);

    const main = screen.getByRole("main");
    const aboutDetail = screen.getByTestId("about-detail");

    expect(main).toContainElement(aboutDetail);
  });
});

describe("AboutPage metadata", () => {
  it("exports metadata with correct title", () => {
    expect(metadata.title).toBe("About - Bjorn Melin | Senior Data Scientist & Cloud Architect");
  });

  it("exports metadata with description mentioning credentials", () => {
    expect(metadata.description).toContain("Senior Data Scientist");
    expect(metadata.description).toContain("AWS certifications");
  });
});
