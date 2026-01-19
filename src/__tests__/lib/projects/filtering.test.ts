import { beforeEach, describe, expect, it } from "vitest";
import {
  deriveCategoryMap,
  filterProjects,
  normalizeText,
  sortProjects,
} from "@/lib/projects/filtering";
import { buildProjectCardModel, resetProjectIdCounter } from "@/test/factories/project";
import type { ProjectCardModel } from "@/types/project";

describe("projects filtering helpers", () => {
  beforeEach(() => {
    resetProjectIdCounter();
  });
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
      buildProjectCardModel({
        id: "a",
        title: "Alpha",
        category: "RAG",
        language: "TypeScript",
        stars: 50,
        tags: ["rag", "nextjs"],
      }),
      buildProjectCardModel({
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
      buildProjectCardModel({ id: "b", title: "Beta", stars: 10, updatedAt: "2026-01-02" }),
      buildProjectCardModel({ id: "a", title: "Alpha", stars: 10, updatedAt: "2026-01-03" }),
      buildProjectCardModel({ id: "c", title: "Gamma", stars: 50, updatedAt: "2025-12-31" }),
    ];

    expect(sortProjects(projects, "stars").map((p) => p.id)).toEqual(["c", "a", "b"]);
    expect(sortProjects(projects, "updated").map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(sortProjects(projects, "name").map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
});
