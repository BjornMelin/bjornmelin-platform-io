import { render, screen } from "@testing-library/react";
import { isValidElement } from "react";
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

vi.mock("@/app/providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

import RootLayout, { metadata, viewport } from "@/app/layout";
import { Providers } from "@/app/providers";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeScript } from "@/components/theme";

const walkReactTree = (
  node: unknown,
  visitor: (element: { type: unknown; props: Record<string, unknown> }) => void,
): void => {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const child of node) walkReactTree(child, visitor);
    return;
  }

  if (isValidElement(node)) {
    visitor(node as { type: unknown; props: Record<string, unknown> });
    walkReactTree((node as { props: { children?: unknown } }).props.children, visitor);
  }
};

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
  it("includes ThemeScript, Providers, and passed children", () => {
    const child = <div data-testid="root-child">Child</div>;
    const tree = RootLayout({ children: child });

    let hasThemeScript = false;
    let hasProviders = false;
    let hasChild = false;

    walkReactTree(tree, (element) => {
      if (element.type === ThemeScript) hasThemeScript = true;
      if (element.type === Providers) hasProviders = true;
      // Ensure the exact child element instance is present in the returned tree.
      if (element === (child as unknown)) hasChild = true;
    });

    expect(hasThemeScript).toBe(true);
    expect(hasProviders).toBe(true);
    expect(hasChild).toBe(true);
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
