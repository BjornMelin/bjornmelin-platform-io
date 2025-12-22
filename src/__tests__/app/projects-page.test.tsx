import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock ProjectGrid component
const mockProjectGrid = vi.fn();
vi.mock("@/components/projects/project-grid", () => ({
  ProjectGrid: (props: { projects: unknown[] }) => {
    mockProjectGrid(props);
    return <div data-testid="project-grid">{props.projects.length} projects</div>;
  },
}));

// Mock projects data with inline data (vi.mock is hoisted, can't use external variables)
vi.mock("@/data/projects", () => ({
  projectsData: [
    { id: "1", title: "Project 1", technologies: ["TypeScript"] },
    { id: "2", title: "Project 2", technologies: ["React"] },
    { id: "3", title: "Project 3", technologies: ["Node.js"] },
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
        projects: expect.any(Array),
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
