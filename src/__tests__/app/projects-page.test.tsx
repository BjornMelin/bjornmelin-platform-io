import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectCardModel } from "@/types/project";

// Mock ProjectGrid component
const mockProjectGrid = vi.fn();
vi.mock("@/components/projects/project-grid", () => ({
  ProjectGrid: (props: {
    projects: ProjectCardModel[];
    categories: string[];
    languages: string[];
  }) => {
    mockProjectGrid(props);
    return <div data-testid="project-grid">{props.projects.length} projects</div>;
  },
}));

// Mock projects data with inline data (vi.mock is hoisted, can't use external variables)
vi.mock("@/data/projects", () => ({
  projectsData: [
    {
      id: "1",
      title: "Project 1",
      description: "Test project 1 description",
      repoUrl: "https://github.com/example/project-1",
      primaryUrl: "https://example.com/project-1",
      stars: 10,
      forks: 1,
      language: "TypeScript",
      updatedAt: "2026-01-01",
      updatedLabel: "Jan 01, 2026",
      topics: ["test"],
      tags: ["test"],
      category: "Test",
      featured: true,
    },
    {
      id: "2",
      title: "Project 2",
      description: "Test project 2 description",
      repoUrl: "https://github.com/example/project-2",
      primaryUrl: "https://example.com/project-2",
      stars: 5,
      forks: 0,
      language: "TypeScript",
      updatedAt: "2026-01-01",
      updatedLabel: "Jan 01, 2026",
      topics: ["test"],
      tags: ["test"],
      category: "Test",
    },
    {
      id: "3",
      title: "Project 3",
      description: "Test project 3 description",
      repoUrl: "https://github.com/example/project-3",
      primaryUrl: "https://example.com/project-3",
      stars: 3,
      forks: 0,
      language: "TypeScript",
      updatedAt: "2026-01-01",
      updatedLabel: "Jan 01, 2026",
      topics: ["test"],
      tags: ["test"],
      category: "Test",
    },
  ],
  projectCategories: ["Test"],
  projectLanguages: ["TypeScript"],
}));

// Import after mocks
import ProjectsPage, { metadata } from "@/app/projects/page";

describe("ProjectsPage", () => {
  beforeEach(() => {
    mockProjectGrid.mockClear();
  });

  it("renders the page heading", () => {
    render(<ProjectsPage />);

    expect(screen.getByRole("heading", { level: 1, name: /projects/i })).toBeInTheDocument();
  });

  it("renders introductory text", () => {
    render(<ProjectsPage />);

    expect(screen.getByText(/collection of projects/i)).toBeInTheDocument();
    expect(screen.getByText(/machine learning/i)).toBeInTheDocument();
  });

  it("renders ProjectGrid component", () => {
    render(<ProjectsPage />);

    expect(screen.getByTestId("project-grid")).toBeInTheDocument();
  });

  it("passes projectsData to ProjectGrid", () => {
    render(<ProjectsPage />);

    expect(mockProjectGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        projects: expect.arrayContaining([
          expect.objectContaining({ id: "1", title: "Project 1" }),
          expect.objectContaining({ id: "2", title: "Project 2" }),
          expect.objectContaining({ id: "3", title: "Project 3" }),
        ]),
        categories: ["Test"],
        languages: ["TypeScript"],
      }),
    );
  });

  it("has accessible hidden heading for project list section", () => {
    render(<ProjectsPage />);

    const srHeading = screen.getByRole("heading", { level: 2, name: /project list/i });
    expect(srHeading).toHaveClass("sr-only");
  });
});

describe("ProjectsPage metadata", () => {
  it("exports metadata with correct title", () => {
    expect(metadata.title).toBe("Projects - Bjorn Melin");
  });

  it("exports metadata with description", () => {
    expect(metadata.description).toContain("portfolio of projects");
    expect(metadata.description).toContain("machine learning");
  });
});
