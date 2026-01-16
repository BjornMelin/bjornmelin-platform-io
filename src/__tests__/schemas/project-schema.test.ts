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

  it("rejects malformed URLs in links", () => {
    expect(() =>
      projectsSchema.parse([
        {
          id: "1",
          title: "Example",
          description: "Example description",
          technologies: ["TypeScript"],
          category: "Web",
          image: "/projects/example.png",
          links: { github: "not-a-url" },
        },
      ]),
    ).toThrow();
  });

  it("rejects missing title", () => {
    expect(() =>
      projectsSchema.parse([
        {
          id: "1",
          // title is missing
          description: "Example description",
          technologies: ["TypeScript"],
          category: "Web",
          image: "/projects/example.png",
          links: { github: "https://github.com" },
          // biome-ignore lint/suspicious/noExplicitAny: Intentional for testing missing title
        } as any,
      ]),
    ).toThrow();
  });

  it("rejects missing id", () => {
    expect(() =>
      projectsSchema.parse([
        {
          // id is missing
          title: "Example",
          description: "Example description",
          technologies: ["TypeScript"],
          category: "Web",
          image: "/projects/example.png",
          links: { github: "https://github.com" },
          // biome-ignore lint/suspicious/noExplicitAny: Intentional for testing missing id
        } as any,
      ]),
    ).toThrow();
  });

  it("rejects empty technologies array", () => {
    expect(() =>
      projectsSchema.parse([
        {
          id: "1",
          title: "Example",
          description: "Example description",
          technologies: [],
          category: "Web",
          image: "/projects/example.png",
          links: { github: "https://github.com" },
        },
      ]),
    ).toThrow();
  });
});
