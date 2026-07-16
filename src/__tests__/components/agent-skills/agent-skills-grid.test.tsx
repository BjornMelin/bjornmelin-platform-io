import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it } from "vitest";
import { AgentSkillsGrid } from "@/components/agent-skills/agent-skills-grid";
import { agentSkillsData } from "@/data/agent-skills";

describe("<AgentSkillsGrid />", () => {
  it("announces a zero-result filter update through one status", async () => {
    const user = userEvent.setup();
    const skills = agentSkillsData.slice(0, 2);

    render(
      <AgentSkillsGrid
        skills={skills}
        categories={[...new Set(skills.map((skill) => skill.category))]}
        readinessLabels={[...new Set(skills.flatMap((skill) => skill.readinessLabels))]}
      />,
      {
        wrapper: withNuqsTestingAdapter({
          hasMemory: true,
          resetUrlUpdateQueueOnMount: false,
        }),
      },
    );

    await user.type(screen.getByRole("searchbox", { name: "Search skills" }), "no-such-skill");

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Showing 0 of 2 skills");
    expect(screen.getByText("No skills match the current filters.")).toBeInTheDocument();
  });
});
