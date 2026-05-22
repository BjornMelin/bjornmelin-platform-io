import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentSkillDetail } from "@/components/agent-skills/agent-skill-detail";
import { agentSkillsData } from "@/data/agent-skills";

describe("<AgentSkillDetail />", () => {
  it("renders detail content without adding a nested main landmark", () => {
    const skill = agentSkillsData[0];
    const { container } = render(<AgentSkillDetail skill={skill} />);

    expect(screen.getByRole("heading", { level: 1, name: skill.name })).toBeInTheDocument();
    expect(container.querySelector("main")).not.toBeInTheDocument();
  });
});
