import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/types/project";

// Mock ProjectGrid component
const mockProjectGrid = vi.fn();
vi.mock("@/components/projects/project-grid", () => ({
  ProjectGrid: (props: { projects: Project[] }) => {
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
      technologies: ["TypeScript"],
      category: "test",
      image: "/test/project-1.png",
      links: { github: "https://example.com/project-1" },
      featured: true,
    },
    {
      id: "2",
      title: "Project 2",
      description: "Test project 2 description",
      technologies: ["React"],
      category: "test",
      image: "/test/project-2.png",
      links: { github: "https://example.com/project-2" },
    },
    {
      id: "3",
      title: "Project 3",
      description: "Test project 3 description",
      technologies: ["Node.js"],
      category: "test",
      image: "/test/project-3.png",
      links: { github: "https://example.com/project-3" },
    },
  ],
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
