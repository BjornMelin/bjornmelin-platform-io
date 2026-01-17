/**
 * @fileoverview Interaction tests for ProjectGrid and smoke for ProjectCard.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectCard } from "@/components/projects/project-card";
import { ProjectGrid } from "@/components/projects/project-grid";
import type { Project } from "@/types/project";

vi.mock("@/components/ui/select", async () => {
  const { SelectMocks } = await import("@/test/ui-mocks");
  return SelectMocks;
});

const demoProjects: Project[] = [
  {
    id: "a",
    title: "A project",
    description: "Alpha",
    technologies: ["ts", "aws"],
    category: "Web",
    image: "/a.png",
    links: { github: "https://github.com/x/a" },
    featured: true,
  },
  {
    id: "b",
    title: "B project",
    description: "Beta",
    technologies: ["react"],
    category: "Data",
    image: "/b.png",
    links: { live: "https://example.com" },
    featured: false,
  },
];

describe("Project components", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("ProjectCard renders title and links conditionally", () => {
    render(<ProjectCard project={demoProjects[0]} />);
    expect(screen.getByText(/A project/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /github/i })).toBeInTheDocument();
    // Live Demo not present for first project
    expect(screen.queryByRole("link", { name: /live demo/i })).toBeNull();
  });

  it("ProjectCard renders demo link when provided", () => {
    const demoProject: Project = {
      ...demoProjects[0],
      links: { demo: "https://demo.example.com" },
    };

    render(<ProjectCard project={demoProject} />);

    expect(screen.getByRole("link", { name: /demo/i })).toBeInTheDocument();
  });

  it("ProjectCard shows a +N trigger when technologies overflow", async () => {
    const user = userEvent.setup();
    const richProject: Project = {
      ...demoProjects[0],
      technologies: ["Next.js", "React", "TypeScript", "Tailwind", "Radix", "Vite"],
    };

    render(<ProjectCard project={richProject} />);

    const trigger = screen.getByLabelText(/show 2 more technologies/i);
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByText("Vite")).toBeInTheDocument();
    expect(screen.getByText("Radix")).toBeInTheDocument();
  });

  it("ProjectGrid filters by category and sorts by featured", () => {
    render(<ProjectGrid projects={demoProjects} />);

    // Initially shows both projects with featured first
    // Featured project should be visible
    expect(screen.getByText(/A project/)).toBeInTheDocument();

    // Filter by Data category; only B project remains
    fireEvent.click(screen.getByRole("radio", { name: "Data" }));
    expect(screen.getByText(/B project/)).toBeInTheDocument();
    expect(screen.queryByText(/A project/)).toBeNull();

    // Reset to All and ensure both are visible again
    fireEvent.click(screen.getByRole("radio", { name: "All" }));
    expect(screen.getByText(/A project/)).toBeInTheDocument();
    expect(screen.getByText(/B project/)).toBeInTheDocument();
  });

  it("ProjectGrid respects search params for category and alphabetical sort", async () => {
    const user = userEvent.setup();
    const { useRouter } = await import("next/navigation");
    useRouter().replace("/projects?category=Data&sort=alphabetical");

    const projects: Project[] = [
      {
        id: "a",
        title: "Zulu Project",
        description: "Zulu",
        technologies: ["ts"],
        category: "Data",
        image: "/z.png",
        links: {},
        featured: false,
      },
      {
        id: "b",
        title: "Alpha Project",
        description: "Alpha",
        technologies: ["ts"],
        category: "Data",
        image: "/a.png",
        links: {},
        featured: false,
      },
      {
        id: "c",
        title: "Web Project",
        description: "Web",
        technologies: ["react"],
        category: "Web",
        image: "/w.png",
        links: {},
        featured: true,
      },
    ];

    render(<ProjectGrid projects={projects} />);

    await waitFor(() => {
      expect(screen.queryByText(/web project/i)).toBeNull();
    });

    const cards = screen.getAllByTestId("project-card");
    expect(cards[0]?.textContent).toContain("Alpha Project");
    expect(cards[1]?.textContent).toContain("Zulu Project");

    const trigger = screen.getByRole("combobox", { name: /sort projects by/i });
    await user.selectOptions(trigger, "featured");

    await waitFor(() => {
      expect(window.location.search).toContain("category=Data");
      expect(window.location.search).not.toContain("sort=");
    });
  });

  it("ProjectGrid defaults to All and featured when params are invalid", async () => {
    const user = userEvent.setup();
    const navigation = await import("next/navigation");
    const invalidParams = new URLSearchParams(
      "category=Unknown&sort=bogus",
    ) as ReadonlyURLSearchParams;
    const searchParamsSpy = vi.spyOn(navigation, "useSearchParams").mockReturnValue(invalidParams);

    const projects: Project[] = [
      {
        id: "a",
        title: "Featured Project",
        description: "Featured",
        technologies: ["ts"],
        category: "Web",
        image: "/f.png",
        links: {},
        featured: true,
      },
      {
        id: "b",
        title: "Regular Project",
        description: "Regular",
        technologies: ["ts"],
        category: "Data",
        image: "/r.png",
        links: {},
        featured: false,
      },
    ];

    render(<ProjectGrid projects={projects} />);

    const cards = await screen.findAllByTestId("project-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]?.textContent).toContain("Featured Project");

    const trigger = screen.getByRole("combobox", { name: /sort projects by/i });
    await user.selectOptions(trigger, "alphabetical");

    await waitFor(() => {
      expect(window.location.search).toContain("sort=alphabetical");
    });

    searchParamsSpy.mockRestore();
  });

  it("ProjectGrid shows empty state when no projects are available", () => {
    render(<ProjectGrid projects={[]} />);
    expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
  });
});
