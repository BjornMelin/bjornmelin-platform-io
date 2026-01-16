import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock UI components
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: { children: React.ReactNode }) => (
    <span {...props}>{children}</span>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
}));

// Mock skills data
vi.mock("@/data/skills", () => ({
  skillCategories: [
    {
      name: "Cloud & DevOps",
      Icon: () => <span>CloudIcon</span>,
      color: "text-blue-500",
      skills: ["AWS", "Docker", "Kubernetes"],
    },
    {
      name: "AI & Machine Learning",
      Icon: () => <span>BrainIcon</span>,
      color: "text-purple-500",
      skills: ["PyTorch", "TensorFlow", "LangChain"],
    },
  ],
}));

// Import after mocks
import { About } from "@/components/sections/about";

describe("About", () => {
  it("renders the section heading", () => {
    render(<About />);

    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/crafting ai solutions/i)).toBeInTheDocument();
  });

  it("renders the about me badge", () => {
    render(<About />);

    expect(screen.getByText("About Me")).toBeInTheDocument();
  });

  it("renders the professional summary description", () => {
    render(<About />);

    // Use getAllByText since the text appears in multiple places (header + background card)
    const seniorDataScientistMatches = screen.getAllByText(/senior data scientist/i);
    expect(seniorDataScientistMatches.length).toBeGreaterThan(0);
    expect(screen.getByText(/aws solutions architect/i)).toBeInTheDocument();
  });

  it("renders the Background card", () => {
    render(<About />);

    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.getByText(/6 aws certifications/i)).toBeInTheDocument();
  });

  it("renders skill categories from data", () => {
    render(<About />);

    expect(screen.getByText("Cloud & DevOps")).toBeInTheDocument();
    expect(screen.getByText("AI & Machine Learning")).toBeInTheDocument();
  });

  it("renders individual skills as badges", () => {
    render(<About />);

    expect(screen.getByText("AWS")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.getByText("PyTorch")).toBeInTheDocument();
  });

  it("renders CTA link to about page", () => {
    render(<About />);

    const ctaLink = screen.getByRole("link", { name: /learn more about me/i });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute("href", "/about");
  });

  it("has section landmark", () => {
    render(<About />);

    expect(screen.getByRole("region", { name: /crafting ai solutions/i })).toBeInTheDocument();
  });
});
