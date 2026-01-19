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
        url: expect.stringMatching(/^https?:\/\//),
        stars: expect.any(Number),
        forks: expect.any(Number),
        updated: expect.any(String),
        topics: expect.any(Array),
      }),
    );
  });
});
