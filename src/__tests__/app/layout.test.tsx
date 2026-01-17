import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "mock-inter-font" }),
}));

vi.mock("@/components/layout/navbar", () => ({
  Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock("@/components/layout/footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock("@/components/structured-data", () => ({
  default: () => <script data-testid="structured-data" />,
}));

vi.mock("@/components/theme", () => ({
  ThemeScript: () => <script data-testid="theme-script" />,
}));

import RootLayout, { metadata, viewport } from "@/app/layout";
import { AppShell } from "@/components/layout/app-shell";
import StructuredData from "@/components/structured-data";
import { ThemeScript } from "@/components/theme";
import { walkReactTree } from "@/test/helpers";

describe("<AppShell />", () => {
  it("renders Navbar and Footer", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("provides a skip link and main landmark", () => {
    render(
      <AppShell>
        <div data-testid="child-content">Test Content</div>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: /skip to content/i })).toBeInTheDocument();

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toContainElement(screen.getByTestId("child-content"));
  });
});

describe("RootLayout", () => {
  it("includes ThemeScript and passed children", () => {
    const child = <div data-testid="root-child">Child</div>;
    const tree = RootLayout({ children: child });

    let hasThemeScript = false;
    let hasChild = false;
    let hasStructuredData = false;

    walkReactTree(tree, (element) => {
      if (element.type === ThemeScript) hasThemeScript = true;
      if (element.type === StructuredData) hasStructuredData = true;
      // Ensure the exact child element instance is present in the returned tree.
      if (element === (child as unknown)) hasChild = true;
    });

    expect(hasThemeScript).toBe(true);
    expect(hasChild).toBe(true);
    expect(hasStructuredData).toBe(true);
  });
});

describe("RootLayout metadata", () => {
  it("has correct title template", () => {
    expect(metadata.title).toEqual({
      template: "%s | Bjorn Melin",
      default: "Bjorn Melin - Senior Data Scientist & Cloud Solutions Architect",
    });
  });

  it("has description", () => {
    expect(metadata.description).toContain("Senior Data Scientist");
    expect(metadata.description).toContain("Cloud Solutions Architect");
  });

  it("has openGraph configuration", () => {
    expect(metadata.openGraph).toBeDefined();
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og.type).toBe("website");
    expect(og.title).toContain("Bjorn Melin");
  });

  it("has twitter card configuration", () => {
    expect(metadata.twitter).toBeDefined();
    const twitter = metadata.twitter as Record<string, unknown>;
    expect(twitter.card).toBe("summary_large_image");
  });

  it("has keywords array", () => {
    expect(metadata.keywords).toBeDefined();
    expect(Array.isArray(metadata.keywords)).toBe(true);
    const keywords = metadata.keywords as string[];
    expect(keywords).toContain("Machine Learning");
    expect(keywords.some((k: string) => k.includes("AWS"))).toBe(true);
  });

  it("has author information", () => {
    expect(metadata.authors).toEqual([{ name: "Bjorn Melin" }]);
    expect(metadata.creator).toBe("Bjorn Melin");
  });
});

describe("RootLayout viewport", () => {
  it("has device-width setting", () => {
    expect(viewport.width).toBe("device-width");
    expect(viewport.initialScale).toBe(1);
  });

  it("has theme-color for light and dark modes", () => {
    expect(viewport.themeColor).toEqual([
      { media: "(prefers-color-scheme: light)", color: "white" },
      { media: "(prefers-color-scheme: dark)", color: "black" },
    ]);
  });
});
