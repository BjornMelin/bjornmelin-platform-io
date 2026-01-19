import type { ProjectCardModel } from "@/types/project";

let projectIdCounter = 0;

/**
 * Build a valid project for tests.
 * Uses auto-incrementing IDs to ensure uniqueness.
 */
export function buildProjectCardModel(overrides: Partial<ProjectCardModel> = {}): ProjectCardModel {
  const id = `project-${++projectIdCounter}`;
  return {
    id,
    title: `Test Project ${projectIdCounter}`,
    description: "A test project description that provides enough detail for display.",
    repoUrl: `https://github.com/test/${id}`,
    primaryUrl: `https://example.com/${id}`,
    liveUrl: "https://test-project.com",
    docsUrl: "https://example.com/docs",
    stars: 42,
    forks: 7,
    language: "TypeScript",
    license: "MIT",
    updatedAt: "2026-01-01",
    updatedLabel: "Jan 01, 2026",
    topics: ["nextjs", "typescript"],
    tags: ["nextjs", "typescript", "react"],
    category: "Web Development",
    featured: false,
    ...overrides,
  };
}

/**
 * Build a featured project.
 */
export function buildFeaturedProjectCardModel(
  overrides: Partial<ProjectCardModel> = {},
): ProjectCardModel {
  return buildProjectCardModel({ ...overrides, featured: true });
}

/**
 * Build multiple projects for list testing.
 */
export function buildProjectCardModelList(
  count: number,
  overrides: Partial<ProjectCardModel> = {},
): ProjectCardModel[] {
  return Array.from({ length: count }, () => buildProjectCardModel(overrides));
}

/**
 * Reset the project ID counter between tests.
 * Call in beforeEach if you need deterministic IDs.
 */
export function resetProjectIdCounter(): void {
  projectIdCounter = 0;
}
