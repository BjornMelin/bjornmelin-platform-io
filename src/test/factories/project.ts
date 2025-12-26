import type { Project, ProjectFilterState } from "@/types/project";

let projectIdCounter = 0;

/**
 * Build a valid project for tests.
 * Uses auto-incrementing IDs to ensure uniqueness.
 */
export function buildProject(overrides: Partial<Project> = {}): Project {
  const id = `project-${++projectIdCounter}`;
  return {
    id,
    title: `Test Project ${projectIdCounter}`,
    description: "A test project description that provides enough detail for display.",
    technologies: ["TypeScript", "React", "Next.js"],
    category: "Web Development",
    image: "/images/projects/test-project.png",
    links: {
      github: "https://github.com/test/project",
      live: "https://test-project.com",
    },
    featured: false,
    ...overrides,
  };
}

/**
 * Build a featured project.
 */
export function buildFeaturedProject(overrides: Partial<Project> = {}): Project {
  return buildProject({ ...overrides, featured: true });
}

/**
 * Build multiple projects for list testing.
 */
export function buildProjectList(count: number, overrides: Partial<Project> = {}): Project[] {
  return Array.from({ length: count }, () => buildProject(overrides));
}

/**
 * Build project filter state for testing.
 */
export function buildProjectFilterState(
  overrides: Partial<ProjectFilterState> = {},
): ProjectFilterState {
  return {
    category: "All",
    sortBy: "featured",
    ...overrides,
  };
}

/**
 * Reset the project ID counter between tests.
 * Call in beforeEach if you need deterministic IDs.
 */
export function resetProjectIdCounter(): void {
  projectIdCounter = 0;
}
