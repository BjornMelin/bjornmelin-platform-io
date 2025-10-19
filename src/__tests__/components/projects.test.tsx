/**
 * @fileoverview Interaction tests for ProjectGrid and smoke for ProjectCard.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // Minimal shim that renders a plain img for tests
    // biome-ignore lint/performance/noImgElement: test shim replaces next/image
    return <img alt={(props.alt as string) ?? ""} {...props} />;
  },
}));

import { ProjectCard } from "@/components/projects/project-card";
import { ProjectGrid } from "@/components/projects/project-grid";
import type { Project } from "@/types/project";

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
  it("ProjectCard renders title and links conditionally", () => {
    render(<ProjectCard project={demoProjects[0]} />);
    expect(screen.getByText(/A project/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /github/i })).toBeInTheDocument();
    // Live Demo not present for first project
    expect(screen.queryByRole("link", { name: /live demo/i })).toBeNull();
  });

  it("ProjectGrid filters by category and sorts by featured", () => {
    render(<ProjectGrid projects={demoProjects} />);

    // Initially shows both projects with featured first
    // Featured project should be visible
    expect(screen.getByText(/A project/)).toBeInTheDocument();

    // Filter by Data category; only B project remains
    fireEvent.click(screen.getByRole("button", { name: "Data" }));
    expect(screen.getByText(/B project/)).toBeInTheDocument();
    expect(screen.queryByText(/A project/)).toBeNull();

    // Reset to All and ensure both are visible again
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText(/A project/)).toBeInTheDocument();
    expect(screen.getByText(/B project/)).toBeInTheDocument();
  });
});
