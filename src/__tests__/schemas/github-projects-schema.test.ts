/* @vitest-environment node */
import { describe, expect, it } from "vitest";
import projectsGenerated from "@/content/projects/projects.generated.json";
import { githubProjectsFileSchema } from "@/lib/schemas/github-projects";

describe("githubProjectsFileSchema", () => {
  it("parses the canonical generated dataset", () => {
    const parsed = githubProjectsFileSchema.parse(projectsGenerated);

    expect(parsed.metadata.generated).toBeTruthy();
    expect(parsed.metadata.totalRepositories).toBeGreaterThan(0);
    expect(parsed.projects.length).toBeGreaterThan(0);

    const first = parsed.projects[0];
    expect(first).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        url: expect.stringMatching(/^https:\/\//),
        stars: expect.any(Number),
        forks: expect.any(Number),
        updated: expect.any(String),
        topics: expect.any(Array),
      }),
    );
  });

  it("rejects non-https project URLs", () => {
    const buildGeneratedProjects = (url: string) => ({
      metadata: {
        generated: "2026-05-25",
        totalRepositories: 1,
      },
      projects: [
        {
          id: "unsafe",
          name: "unsafe",
          url,
          stars: 1,
          forks: 0,
          updated: "2026-05-25",
          topics: [],
        },
      ],
    });

    expect(
      githubProjectsFileSchema.safeParse(buildGeneratedProjects("https://example.com")).success,
    ).toBe(true);
    expect(
      githubProjectsFileSchema.safeParse(buildGeneratedProjects("javascript:alert(1)")).success,
    ).toBe(false);
    expect(
      githubProjectsFileSchema.safeParse(buildGeneratedProjects("http://example.com")).success,
    ).toBe(false);
  });
});
