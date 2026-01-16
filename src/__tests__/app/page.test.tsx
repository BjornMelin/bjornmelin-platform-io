import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock section components
vi.mock("@/components/sections/hero", () => ({
  Hero: () => (
    <section data-testid="hero-section">
      <h1>Hi, I&apos;m Bjorn Melin</h1>
    </section>
  ),
}));

vi.mock("@/components/sections/about", () => ({
  About: () => (
    <section data-testid="about-section">
      <h2>About Me</h2>
    </section>
  ),
}));

vi.mock("@/components/sections/featured-projects", () => ({
  FeaturedProjects: () => (
    <section data-testid="featured-projects-section">
      <h2>Featured Projects</h2>
    </section>
  ),
}));

// Import after mocks
import Home, { metadata } from "@/app/page";

describe("Home page", () => {
  it("renders Hero section", () => {
    render(<Home />);

    expect(screen.getByTestId("hero-section")).toBeInTheDocument();
  });

  it("renders About section", () => {
    render(<Home />);

    expect(screen.getByTestId("about-section")).toBeInTheDocument();
  });

  it("renders FeaturedProjects section", () => {
    render(<Home />);

    expect(screen.getByTestId("featured-projects-section")).toBeInTheDocument();
  });

  it("renders sections in correct order", () => {
    const { container } = render(<Home />);

    const sections = container.querySelectorAll("[data-testid$='-section']");
    expect(sections?.length).toBe(3);
    expect(sections?.[0].getAttribute("data-testid")).toBe("hero-section");
    expect(sections?.[1].getAttribute("data-testid")).toBe("about-section");
    expect(sections?.[2].getAttribute("data-testid")).toBe("featured-projects-section");
  });

  it("has correct heading hierarchy for accessibility", () => {
    render(<Home />);

    // H1 should be in Hero
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Bjorn Melin");

    // H2s should be in About and FeaturedProjects
    const h2s = screen.getAllByRole("heading", { level: 2 });
    expect(h2s.length).toBe(2);
  });
});

describe("Home page metadata", () => {
  it("exports metadata with correct title", () => {
    expect(metadata.title).toBe("Bjorn Melin - Senior Data Scientist & Cloud Solutions Architect");
  });

  it("exports metadata with description mentioning key skills", () => {
    expect(metadata.description).toContain("AI/ML");
    expect(metadata.description).toContain("AWS Certified");
  });

  it("exports metadata with openGraph configuration", () => {
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph).toEqual(expect.objectContaining({ type: "website" }));
    expect(metadata.openGraph).toHaveProperty("images");
  });

  it("exports metadata with twitter card configuration", () => {
    expect(metadata.twitter).toBeDefined();
    expect(metadata.twitter).toHaveProperty("card", "summary_large_image");
  });
});
