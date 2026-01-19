import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProjectCard } from "@/components/projects/project-card";
import { buildProjectCardModel } from "@/test/factories";

describe("<ProjectCard />", () => {
  it("renders without images", () => {
    const project = buildProjectCardModel({
      title: "Alpha",
      primaryUrl: "https://example.com/alpha",
      repoUrl: "https://github.com/test/alpha",
    });

    render(<ProjectCard project={project} />);

    expect(screen.getByRole("link", { name: "Alpha" })).toHaveAttribute("href", project.primaryUrl);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("links to primaryUrl and repoUrl", () => {
    const project = buildProjectCardModel({
      title: "Beta",
      primaryUrl: "https://example.com/beta",
      repoUrl: "https://github.com/test/beta",
    });

    render(<ProjectCard project={project} />);

    expect(screen.getByRole("link", { name: "Beta" })).toHaveAttribute("href", project.primaryUrl);
    expect(screen.getByLabelText(/open beta repository on github/i)).toHaveAttribute(
      "href",
      project.repoUrl,
    );
  });

  it("renders stats row", () => {
    const project = buildProjectCardModel({
      title: "Stats Project",
      stars: 1200,
      forks: 34,
      updatedLabel: "Jan 01, 2026",
    });

    render(<ProjectCard project={project} />);

    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText(/updated jan 01, 2026/i)).toBeInTheDocument();
  });

  it("shows a +N trigger when tags overflow and reveals hidden tags", async () => {
    const user = userEvent.setup();
    const project = buildProjectCardModel({
      tags: ["Next.js", "React", "TypeScript", "Tailwind", "Zod", "nuqs"],
    });

    render(<ProjectCard project={project} />);

    const trigger = screen.getByLabelText(/show 2 more tags/i);
    await user.click(trigger);

    expect(await screen.findByText("Zod")).toBeInTheDocument();
    expect(screen.getByText("nuqs")).toBeInTheDocument();
  });
});
