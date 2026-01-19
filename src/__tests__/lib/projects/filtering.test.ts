import { describe, expect, it } from "vitest";
import {
  deriveCategoryMap,
  filterProjects,
  normalizeText,
  sortProjects,
} from "@/lib/projects/filtering";
import type { ProjectCardModel } from "@/types/project";

const baseProject = (overrides: Partial<ProjectCardModel>): ProjectCardModel => ({
  id: "p",
  title: "Example",
  description: "Example description",
  repoUrl: "https://github.com/test/p",
  primaryUrl: "https://example.com/p",
  stars: 1,
  forks: 0,
  updatedAt: "2026-01-01",
  updatedLabel: "Jan 01, 2026",
  topics: [],
  tags: [],
  category: "Other",
  featured: false,
  ...overrides,
});

describe("projects filtering helpers", () => {
  it("normalizes text for matching", () => {
    expect(normalizeText("  Café  ")).toBe("cafe");
  });

  it("derives category map from topicClusters", () => {
    const map = deriveCategoryMap({
      rag: ["a", "b"],
      aiAgents: ["b", "c"],
    });

    expect(map.get("a")).toBe("RAG");
    expect(map.get("b")).toBe("RAG"); // first match wins
  });

  it("filters by query, category, language, and minStars", () => {
    const projects: ProjectCardModel[] = [
      baseProject({
        id: "a",
        title: "Alpha",
        category: "RAG",
        language: "TypeScript",
        stars: 50,
        tags: ["rag", "nextjs"],
      }),
      baseProject({
        id: "b",
        title: "Beta",
        category: "Web Scraping",
        language: "Python",
        stars: 8,
        tags: ["playwright"],
      }),
    ];

    const filtered = filterProjects(projects, {
      q: "rag",
      category: "RAG",
      lang: "typescript",
      minStars: 10,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("a");
  });

  it("sorts by stars, updated, and name", () => {
    const projects: ProjectCardModel[] = [
      baseProject({ id: "b", title: "Beta", stars: 10, updatedAt: "2026-01-02" }),
      baseProject({ id: "a", title: "Alpha", stars: 10, updatedAt: "2026-01-03" }),
      baseProject({ id: "c", title: "Gamma", stars: 50, updatedAt: "2025-12-31" }),
    ];

    expect(sortProjects(projects, "stars").map((p) => p.id)).toEqual(["c", "a", "b"]);
    expect(sortProjects(projects, "updated").map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(sortProjects(projects, "name").map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
});
