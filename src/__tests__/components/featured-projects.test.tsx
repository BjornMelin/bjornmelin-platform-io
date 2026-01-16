import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock SectionHeader
vi.mock("@/components/shared/section-header", () => ({
  SectionHeader: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="section-header">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

// Mock ProjectCard - track calls for verification
const mockProjectCard = vi.fn();
vi.mock("@/components/projects/project-card", () => ({
  ProjectCard: ({ project }: { project: { id: string; title: string } }) => {
    mockProjectCard(project);
    return <div data-testid={`project-card-${project.id}`}>{project.title}</div>;
  },
}));

// Mock projects data with featured and non-featured projects
vi.mock("@/data/projects", () => ({
  projectsData: [
    { id: "featured-1", title: "Featured Project 1", featured: true, technologies: ["TypeScript"] },
    { id: "featured-2", title: "Featured Project 2", featured: true, technologies: ["React"] },
    { id: "not-featured", title: "Not Featured", featured: false, technologies: ["Node.js"] },
  ],
}));

// Import after mocks
import { FeaturedProjects } from "@/components/sections/featured-projects";

describe("FeaturedProjects", () => {
  beforeEach(() => {
    mockProjectCard.mockClear();
  });

  it("renders section header with title and description", () => {
    render(<FeaturedProjects />);

    expect(screen.getByTestId("section-header")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /featured projects/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/recent work/i)).toBeInTheDocument();
  });

  it("renders only featured projects", () => {
    render(<FeaturedProjects />);

    expect(screen.getByTestId("project-card-featured-1")).toBeInTheDocument();
    expect(screen.getByTestId("project-card-featured-2")).toBeInTheDocument();
    expect(screen.queryByTestId("project-card-not-featured")).not.toBeInTheDocument();
  });

  it("renders 'View All Projects' link", () => {
    render(<FeaturedProjects />);

    const viewAllLink = screen.getByRole("link", { name: /view all projects/i });
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink).toHaveAttribute("href", "/projects");
  });

  it("has section landmark", () => {
    const { container } = render(<FeaturedProjects />);

    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("passes correct project data to ProjectCard", () => {
    render(<FeaturedProjects />);

    // Should have called ProjectCard only for featured projects
    expect(mockProjectCard).toHaveBeenCalledTimes(2);
    expect(mockProjectCard).toHaveBeenCalledWith(
      expect.objectContaining({ id: "featured-1", featured: true }),
    );
    expect(mockProjectCard).toHaveBeenCalledWith(
      expect.objectContaining({ id: "featured-2", featured: true }),
    );
  });
});
