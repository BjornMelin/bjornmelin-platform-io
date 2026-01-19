import { describe, expect, it, vi } from "vitest";

type TestProject = {
  id: string;
  name: string;
  url: string;
  stars: number;
  forks: number;
  updated: string;
  topics: string[];
};

const baseProjects: TestProject[] = [
  {
    id: "project-alpha",
    name: "Project Alpha",
    url: "https://github.com/example/project-alpha",
    stars: 50,
    forks: 5,
    updated: "2024-01-01",
    topics: ["alpha"],
  },
  {
    id: "project-beta",
    name: "Project Beta",
    url: "https://github.com/example/project-beta",
    stars: 40,
    forks: 4,
    updated: "2024-01-02",
    topics: ["beta"],
  },
  {
    id: "project-gamma",
    name: "Project Gamma",
    url: "https://github.com/example/project-gamma",
    stars: 30,
    forks: 3,
    updated: "2024-01-03",
    topics: ["gamma"],
  },
  {
    id: "project-delta",
    name: "Project Delta",
    url: "https://github.com/example/project-delta",
    stars: 10,
    forks: 1,
    updated: "2024-01-04",
    topics: ["delta"],
  },
];

const buildGeneratedProjects = (projects: TestProject[]) => ({
  metadata: {
    generated: "2024-01-05",
    totalRepositories: projects.length,
    description: "Test projects",
  },
  projects,
});

const loadProjectsData = async ({
  overrides,
  projects = baseProjects,
}: {
  overrides: Record<string, { featured?: boolean }>;
  projects?: TestProject[];
}) => {
  vi.resetModules();
  vi.doMock("@/content/projects/overrides", () => ({
    projectOverrides: overrides,
  }));
  vi.doMock("@/content/projects/projects.generated.json", () => ({
    default: buildGeneratedProjects(projects),
  }));

  const { projectsData } = await import("@/data/projects");
  return projectsData;
};

describe("projects data featured fallback", () => {
  it("applies fallback when no explicit featured true exists", async () => {
    const projectsData = await loadProjectsData({
      overrides: {
        "project-delta": { featured: false },
      },
    });

    const featuredIds = projectsData
      .filter((project) => project.featured)
      .map((project) => project.id)
      .sort();
    expect(featuredIds).toEqual(["project-alpha", "project-beta", "project-gamma"].sort());
  });

  it("disables fallback when a project is explicitly featured", async () => {
    const projectsData = await loadProjectsData({
      overrides: {
        "project-beta": { featured: true },
        "project-delta": { featured: false },
      },
    });

    const featuredIds = projectsData
      .filter((project) => project.featured)
      .map((project) => project.id)
      .sort();
    expect(featuredIds).toEqual(["project-beta"].sort());
  });
});
