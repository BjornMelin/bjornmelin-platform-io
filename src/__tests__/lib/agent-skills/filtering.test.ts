import { describe, expect, it } from "vitest";
import { agentSkillsData } from "@/data/agent-skills";
import { filterAgentSkills, sortAgentSkills } from "@/lib/agent-skills/filtering";

describe("agent skills filtering", () => {
  it("filters skills by text query", () => {
    const result = filterAgentSkills(agentSkillsData, {
      q: "deep-researcher",
      category: "all",
      readiness: "all",
      packageState: "all",
    });

    expect(result.map((skill) => skill.slug)).toContain("deep-researcher");
  });

  it("filters packaged skills", () => {
    const result = filterAgentSkills(agentSkillsData, {
      q: "",
      category: "all",
      readiness: "all",
      packageState: "packaged",
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((skill) => skill.packageStatus.present)).toBe(true);
  });

  it("sorts featured skills before non-featured skills", () => {
    const sorted = sortAgentSkills(agentSkillsData, "featured");

    expect(sorted[0]?.featured).toBe(true);
    expect(sorted.findIndex((skill) => !skill.featured)).toBeGreaterThan(0);
  });
});
