import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { ProjectGrid } from "@/components/projects/project-grid";
import type { ProjectCardModel } from "@/types/project";

function buildProjects(): ProjectCardModel[] {
  return [
    {
      id: "alpha",
      title: "Alpha",
      description: "RAG project",
      repoUrl: "https://github.com/test/alpha",
      primaryUrl: "https://example.com/alpha",
      stars: 50,
      forks: 2,
      language: "TypeScript",
      license: "MIT",
      updatedAt: "2026-01-02",
      updatedLabel: "Jan 02, 2026",
      topics: ["rag"],
      tags: ["rag", "nextjs"],
      category: "RAG",
      featured: false,
    },
    {
      id: "beta",
      title: "Beta",
      description: "Scraper utility",
      repoUrl: "https://github.com/test/beta",
      primaryUrl: "https://example.com/beta",
      stars: 8,
      forks: 1,
      language: "Python",
      license: "MIT",
      updatedAt: "2026-01-03",
      updatedLabel: "Jan 03, 2026",
      topics: ["web-scraping"],
      tags: ["web-scraping", "playwright"],
      category: "Web Scraping",
      featured: false,
    },
    {
      id: "gamma",
      title: "Gamma",
      description: "General app",
      repoUrl: "https://github.com/test/gamma",
      primaryUrl: "https://example.com/gamma",
      stars: 30,
      forks: 3,
      language: "TypeScript",
      license: "MIT",
      updatedAt: "2025-12-20",
      updatedLabel: "Dec 20, 2025",
      topics: ["nextjs"],
      tags: ["nextjs", "tailwind"],
      category: "Other",
      featured: true,
    },
  ];
}

describe("<ProjectGrid />", () => {
  it("renders all projects by default", () => {
    const projects = buildProjects();
    const categories = ["Other", "RAG", "Web Scraping"];
    const languages = ["Python", "TypeScript"];

    render(<ProjectGrid projects={projects} categories={categories} languages={languages} />, {
      wrapper: withNuqsTestingAdapter({ hasMemory: true }),
    });

    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 3 of 3 projects");
    expect(screen.getAllByTestId("project-card")).toHaveLength(3);
  });

  it("filters by search and updates the URL state", async () => {
    const user = userEvent.setup();
    const projects = buildProjects();
    const categories = ["Other", "RAG", "Web Scraping"];
    const languages = ["Python", "TypeScript"];

    const onUrlUpdate = vi.fn();
    render(<ProjectGrid projects={projects} categories={categories} languages={languages} />, {
      wrapper: withNuqsTestingAdapter({
        hasMemory: true,
        onUrlUpdate,
        resetUrlUpdateQueueOnMount: false,
      }),
    });

    await user.type(screen.getByRole("searchbox", { name: /search projects/i }), "beta");

    expect(screen.getAllByTestId("project-card")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Beta" })).toBeInTheDocument();

    expect(onUrlUpdate).toHaveBeenCalled();
    const last = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(last?.queryString).toContain("q=beta");
  });

  it("filters by category and language", async () => {
    const user = userEvent.setup();
    const projects = buildProjects();
    const categories = ["Other", "RAG", "Web Scraping"];
    const languages = ["Python", "TypeScript"];

    render(<ProjectGrid projects={projects} categories={categories} languages={languages} />, {
      wrapper: withNuqsTestingAdapter({ hasMemory: true, resetUrlUpdateQueueOnMount: false }),
    });

    // Category -> Web Scraping
    await user.click(screen.getByRole("combobox", { name: /filter by category/i }));
    await user.click(screen.getByRole("option", { name: "Web Scraping" }));

    expect(screen.getAllByTestId("project-card")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Beta" })).toBeInTheDocument();

    // Language -> TypeScript (should yield empty set with current category)
    await user.click(screen.getByRole("combobox", { name: /filter by language/i }));
    await user.click(screen.getByRole("option", { name: "TypeScript" }));

    expect(screen.queryAllByTestId("project-card")).toHaveLength(0);
    expect(screen.getByText(/no projects match/i)).toBeInTheDocument();
  });

  it("applies minStars and sorting", async () => {
    const user = userEvent.setup();
    const projects = buildProjects();
    const categories = ["Other", "RAG", "Web Scraping"];
    const languages = ["Python", "TypeScript"];

    render(<ProjectGrid projects={projects} categories={categories} languages={languages} />, {
      wrapper: withNuqsTestingAdapter({ hasMemory: true, resetUrlUpdateQueueOnMount: false }),
    });

    // minStars -> 25+ (filters out Beta)
    await user.click(screen.getByRole("combobox", { name: /filter by minimum stars/i }));
    await user.click(screen.getByRole("option", { name: "25+" }));

    expect(screen.getAllByTestId("project-card")).toHaveLength(2);

    // Sort -> Name (Alpha then Gamma)
    await user.click(screen.getByRole("combobox", { name: /sort projects/i }));
    await user.click(screen.getByRole("option", { name: "Name" }));

    const cards = screen.getAllByTestId("project-card");
    const [first, second] = cards;
    if (!first || !second) {
      throw new Error(`Expected 2 project cards after filtering, got ${cards.length}`);
    }
    expect(within(first).getByRole("link", { name: "Alpha" })).toBeInTheDocument();
    expect(within(second).getByRole("link", { name: "Gamma" })).toBeInTheDocument();
  });
});
