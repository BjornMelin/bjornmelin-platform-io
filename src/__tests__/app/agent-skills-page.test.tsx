import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentSkillCardModel, AgentSkillsMetadata } from "@/types/agent-skill";

const mockAgentSkillsHero = vi.fn();
const mockAgentSkillsGrid = vi.fn();

vi.mock("@/components/agent-skills/agent-skills-hero", () => ({
  AgentSkillsHero: (props: {
    featuredSkills: AgentSkillCardModel[];
    metadata: AgentSkillsMetadata;
  }) => {
    mockAgentSkillsHero(props);
    return <div data-testid="agent-skills-hero">Agent Skills Lab</div>;
  },
}));

vi.mock("@/components/agent-skills/agent-skills-grid", () => ({
  AgentSkillsGrid: (props: {
    skills: AgentSkillCardModel[];
    categories: string[];
    readinessLabels: readonly string[];
  }) => {
    mockAgentSkillsGrid(props);
    return <div data-testid="agent-skills-grid">{props.skills.length} skills</div>;
  },
}));

vi.mock("@/data/agent-skills", () => ({
  agentSkillsData: [
    {
      name: "deep-researcher",
      slug: "deep-researcher",
      description: "Research workflow",
      category: "Research",
      path: "skills/deep-researcher",
      skillMdPath: "skills/deep-researcher/SKILL.md",
      detailHref: "/agent-skills/deep-researcher",
      sourceLinks: { directory: "https://example.com", skillMd: "https://example.com/SKILL.md" },
      installCommands: { codexGlobal: "install", codexProject: "project", allAgents: "agents" },
      readinessLabels: ["Valid", "Packaged"],
      qualitySignals: [],
      improvementSignals: [],
      resources: { references: 1, scripts: 1, assets: 0, templates: 0, agents: 1, total: 3 },
      packageStatus: { path: "dist.skill", present: true, rejected: false },
      featured: true,
      score: 8,
    },
  ],
  featuredAgentSkills: [
    {
      name: "deep-researcher",
      slug: "deep-researcher",
      description: "Research workflow",
      category: "Research",
      path: "skills/deep-researcher",
      skillMdPath: "skills/deep-researcher/SKILL.md",
      detailHref: "/agent-skills/deep-researcher",
      sourceLinks: { directory: "https://example.com", skillMd: "https://example.com/SKILL.md" },
      installCommands: { codexGlobal: "install", codexProject: "project", allAgents: "agents" },
      readinessLabels: ["Valid", "Packaged"],
      qualitySignals: [],
      improvementSignals: [],
      resources: { references: 1, scripts: 1, assets: 0, templates: 0, agents: 1, total: 3 },
      packageStatus: { path: "dist.skill", present: true, rejected: false },
      featured: true,
      score: 8,
    },
  ],
  agentSkillCategories: ["Research"],
  agentSkillReadinessLabels: ["Valid", "Packaged"],
  agentSkillsMetadata: {
    generatedAt: "2026-05-21T00:00:00Z",
    sourceRepository: "https://github.com/BjornMelin/dev-skills",
    sourceCommit: "abcdef1",
    skillsCount: 1,
    totalSkillDirectories: 1,
    packagedCount: 1,
    installCommands: {
      list: "list",
      installAllCodex: "install all codex",
      installAllAgents: "install all agents",
    },
  },
}));

import AgentSkillsPage, { metadata } from "@/app/agent-skills/page";

describe("AgentSkillsPage", () => {
  beforeEach(() => {
    mockAgentSkillsHero.mockClear();
    mockAgentSkillsGrid.mockClear();
  });

  it("renders hero and grid sections", () => {
    const { container } = render(<AgentSkillsPage />);

    expect(screen.getByTestId("agent-skills-hero")).toBeInTheDocument();
    expect(screen.getByTestId("agent-skills-grid")).toBeInTheDocument();
    expect(container.querySelector("main")).not.toBeInTheDocument();
  });

  it("passes catalog data to child components", () => {
    render(<AgentSkillsPage />);

    expect(mockAgentSkillsHero).toHaveBeenCalledWith(
      expect.objectContaining({
        featuredSkills: expect.arrayContaining([
          expect.objectContaining({ slug: "deep-researcher" }),
        ]),
      }),
    );
    expect(mockAgentSkillsGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: ["Research"],
        readinessLabels: ["Valid", "Packaged"],
      }),
    );
  });
});

describe("AgentSkillsPage metadata", () => {
  it("exports marketplace metadata", () => {
    expect(metadata.title).toBe("Agent Skills Lab - Bjorn Melin");
    expect(metadata.description).toContain("public marketplace");
  });
});
