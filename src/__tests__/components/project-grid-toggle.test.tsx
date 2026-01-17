import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ProjectGrid } from "@/components/projects/project-grid";
import type { Project } from "@/types/project";

vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
  }) => (
    <select
      aria-label="Sort projects by"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) =>
    placeholder ? (
      <option value="" disabled hidden>
        {placeholder}
      </option>
    ) : null,
}));

vi.mock("@/components/ui/toggle-group", () => ({
  ToggleGroup: ({
    onValueChange,
    children,
  }: {
    onValueChange: (value: string) => void;
    children: ReactNode;
  }) => (
    <div>
      <button type="button" onClick={() => onValueChange("")}>
        Clear
      </button>
      {children}
    </div>
  ),
  ToggleGroupItem: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

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
