import { describe, expect, it } from "vitest";
import {
  agentSkillCategories,
  agentSkillReadinessLabels,
  agentSkillsData,
  agentSkillsMetadata,
  featuredAgentSkills,
  getAgentSkillBySlug,
} from "@/data/agent-skills";

describe("agent skills data", () => {
  it("parses generated catalog metadata and skill counts", () => {
    expect(agentSkillsMetadata.skillsCount).toBe(agentSkillsData.length);
    expect(agentSkillsMetadata.validSkillsCount).toBe(agentSkillsData.length);
    expect(agentSkillsMetadata.totalSkillDirectories).toBeGreaterThanOrEqual(
      agentSkillsData.length,
    );
    expect(agentSkillsMetadata.sourceRepository).toBe("https://github.com/BjornMelin/dev-skills");
    expect(agentSkillsMetadata.installCommands.installAllCodex).toContain("npx skills add");
  });

  it("exposes featured skills first with detail routes", () => {
    expect(featuredAgentSkills.length).toBeGreaterThan(0);
    expect(agentSkillsData[0]?.featured).toBe(true);
    expect(getAgentSkillBySlug("deep-researcher")).toEqual(
      expect.objectContaining({
        slug: "deep-researcher",
        featured: true,
        detailHref: "/agent-skills/deep-researcher",
      }),
    );
  });

  it("derives category and readiness filters from the catalog", () => {
    expect(agentSkillCategories).toContain("Agent Ops");
    expect(agentSkillReadinessLabels).toContain("Valid");
    expect(agentSkillReadinessLabels).toContain("Packaged");
  });
});
