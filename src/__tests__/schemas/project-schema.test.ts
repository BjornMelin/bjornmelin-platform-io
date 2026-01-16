import { describe, expect, it } from "vitest";
import { projectsSchema } from "@/lib/schemas/project";

describe("projectsSchema", () => {
  it("parses valid projects", () => {
    const projects = projectsSchema.parse([
      {
        id: "1",
        title: "Example",
        description: "Example description",
        technologies: ["TypeScript"],
        category: "Web",
        image: "/projects/example.png",
        links: { github: "https://github.com/example/repo" },
        featured: true,
      },
    ]);

    expect(projects).toHaveLength(1);
    expect(projects[0]?.links.github).toContain("github.com");
  });

  it("rejects projects without any links", () => {
    expect(() =>
      projectsSchema.parse([
        {
          id: "1",
          title: "Example",
          description: "Example description",
          technologies: ["TypeScript"],
          category: "Web",
          image: "/projects/example.png",
          links: {},
        },
      ]),
    ).toThrow(/at least one project link/i);
  });
});

