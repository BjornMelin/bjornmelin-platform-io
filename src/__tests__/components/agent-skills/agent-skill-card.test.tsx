import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentSkillCard } from "@/components/agent-skills/agent-skill-card";
import type { AgentSkillCardModel } from "@/types/agent-skill";

function buildAgentSkillCardModel(
  overrides: Partial<AgentSkillCardModel> = {},
): AgentSkillCardModel {
  return {
    name: "deep-researcher",
    slug: "deep-researcher",
    description: "Research workflow with evidence-led reporting.",
    category: "Research",
    path: "skills/deep-researcher",
    skillMdPath: "skills/deep-researcher/SKILL.md",
    detailHref: "/agent-skills/deep-researcher",
    sourceLinks: {
      directory: "https://github.com/example/dev-skills/tree/main/skills/deep-researcher",
      skillMd: "https://github.com/example/dev-skills/blob/main/skills/deep-researcher/SKILL.md",
    },
    installCommands: {
      codexGlobal: "codex skills install deep-researcher",
      codexProject: "codex skills install --project deep-researcher",
      allAgents: "agents install deep-researcher",
    },
    readinessLabels: ["Valid", "Packaged"],
    qualitySignals: [],
    improvementSignals: [],
    resources: {
      references: 1,
      scripts: 1,
      assets: 0,
      templates: 0,
      agents: 1,
      total: 3,
    },
    packageStatus: {
      path: "dist/deep-researcher.skill",
      present: true,
      rejected: false,
    },
    featured: true,
    score: 8,
    ...overrides,
  };
}

describe("<AgentSkillCard />", () => {
  it("uses contextual accessible names for repeated card actions", () => {
    const skill = buildAgentSkillCardModel({ name: "repo-modernizer" });

    render(<AgentSkillCard skill={skill} />);

    expect(screen.getByRole("link", { name: "View repo-modernizer details" })).toHaveAttribute(
      "href",
      skill.detailHref,
    );
    expect(screen.getByLabelText("Open repo-modernizer SKILL.md on GitHub")).toHaveAttribute(
      "href",
      skill.sourceLinks.skillMd,
    );
    expect(
      screen.getByLabelText("Open repo-modernizer source directory on GitHub"),
    ).toHaveAttribute("href", skill.sourceLinks.directory);
  });
});
