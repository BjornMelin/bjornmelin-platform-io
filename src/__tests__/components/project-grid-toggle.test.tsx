import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectGrid } from "@/components/projects/project-grid";
import type { Project } from "@/types/project";

vi.mock("@/components/ui/select", async () => {
  const { SelectMocks } = await import("@/test/ui-mocks");
  return SelectMocks;
});

vi.mock("@/components/ui/toggle-group", async () => {
  const { ToggleGroupMocks } = await import("@/test/ui-mocks");
  return ToggleGroupMocks;
});

const demoProjects: Project[] = [
  {
    id: "a",
    title: "Alpha",
    description: "Alpha",
    technologies: ["ts"],
    category: "Web",
    image: "/a.png",
    links: {},
    featured: false,
  },
];

describe("ProjectGrid empty toggle", () => {
  it("ignores empty toggle values without changing output", () => {
    render(<ProjectGrid projects={demoProjects} />);

    expect(screen.getByRole("heading", { name: /alpha/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.getByRole("heading", { name: /alpha/i })).toBeInTheDocument();
  });
});
