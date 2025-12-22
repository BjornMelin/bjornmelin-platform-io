import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next/font/google to avoid font loading in tests
vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "mock-inter-font" }),
}));

// Mock child components to avoid complex dependency chains
vi.mock("@/components/layout/navbar", () => ({
  Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock("@/components/layout/footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock("@/components/structured-data", () => ({
  default: () => <script data-testid="structured-data" />,
}));

// Mock the providers with proper path
vi.mock("@/app/providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

// Import after mocks are set up
import RootLayout, { metadata, viewport } from "@/app/layout";

describe("RootLayout", () => {
  it("renders children within the layout structure", () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Test Content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("includes Navbar component", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  it("includes Footer component", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("wraps content with Providers", () => {
    render(
      <RootLayout>
        <div data-testid="content">Content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("providers")).toBeInTheDocument();
  });

  it("includes StructuredData component", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("structured-data")).toBeInTheDocument();
  });
});

describe("RootLayout metadata", () => {
  it("exports metadata with correct title template", () => {
    expect(metadata.title).toEqual({
      template: "%s | Bjorn Melin",
      default: "Bjorn Melin - Senior Data Scientist & Cloud Solutions Architect",
    });
  });

  it("exports metadata with description", () => {
    expect(metadata.description).toContain("Senior Data Scientist");
    expect(metadata.description).toContain("Cloud Solutions Architect");
  });

  it("exports metadata with openGraph configuration", () => {
    expect(metadata.openGraph).toBeDefined();
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og.type).toBe("website");
    expect(og.title).toContain("Bjorn Melin");
  });

  it("exports metadata with twitter card configuration", () => {
    expect(metadata.twitter).toBeDefined();
    const twitter = metadata.twitter as Record<string, unknown>;
    expect(twitter.card).toBe("summary_large_image");
  });

  it("exports metadata with keywords array", () => {
    expect(metadata.keywords).toBeDefined();
    expect(Array.isArray(metadata.keywords)).toBe(true);
    const keywords = metadata.keywords as string[];
    expect(keywords).toContain("Machine Learning");
    // Check for AWS-related keywords
    expect(keywords.some((k: string) => k.includes("AWS"))).toBe(true);
  });

  it("exports metadata with author information", () => {
    expect(metadata.authors).toEqual([{ name: "Bjorn Melin" }]);
    expect(metadata.creator).toBe("Bjorn Melin");
  });
});

describe("RootLayout viewport", () => {
  it("exports viewport with device-width", () => {
    expect(viewport.width).toBe("device-width");
    expect(viewport.initialScale).toBe(1);
  });

  it("exports viewport with theme-color for light and dark modes", () => {
    expect(viewport.themeColor).toEqual([
      { media: "(prefers-color-scheme: light)", color: "white" },
      { media: "(prefers-color-scheme: dark)", color: "black" },
    ]);
  });
});
