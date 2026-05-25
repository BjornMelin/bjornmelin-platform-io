/* @vitest-environment node */
import { describe, expect, it } from "vitest";
import agentSkillsGenerated from "@/content/agent-skills/agent-skills.generated.json";
import { agentSkillsCatalogSchema } from "@/lib/schemas/agent-skills-catalog";

const generatedCatalogSkill = {
  name: "deep-researcher",
  slug: "deep-researcher",
  description: "Research workflow with evidence-led reporting.",
  path: "skills/deep-researcher",
  skillMdPath: "skills/deep-researcher/SKILL.md",
  sourceUrls: {
    directory: "https://github.com/BjornMelin/dev-skills/tree/main/skills/deep-researcher",
    skillMd: "https://github.com/BjornMelin/dev-skills/blob/main/skills/deep-researcher/SKILL.md",
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
  exposure: {
    readme_catalog: true,
    docs_index: true,
  },
  package: {
    path: "dist/deep-researcher.skill",
    present: true,
    rejected: false,
  },
};

function buildGeneratedCatalog(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "agent_skills_lab_catalog.v1",
    generatedAt: "2026-05-25T00:00:00Z",
    sourceRepository: "https://github.com/BjornMelin/dev-skills",
    sourceCommit: "abcdef1",
    skillsCount: 1,
    totalSkillDirectories: 1,
    installCommands: {
      list: "npx skills list",
      installAllCodex: "npx skills add --all",
      installAllAgents: "agents install --all",
    },
    skills: [generatedCatalogSkill],
    ...overrides,
  };
}

function buildGeneratedCatalogWithSourceUrls(
  sourceUrls: Partial<typeof generatedCatalogSkill.sourceUrls>,
) {
  return buildGeneratedCatalog({
    skills: [
      {
        ...generatedCatalogSkill,
        sourceUrls: {
          ...generatedCatalogSkill.sourceUrls,
          ...sourceUrls,
        },
      },
    ],
  });
}

describe("agentSkillsCatalogSchema", () => {
  it("parses the canonical generated catalog", () => {
    const parsed = agentSkillsCatalogSchema.parse(agentSkillsGenerated);

    expect(parsed.schemaVersion).toBe("agent_skills_lab_catalog.v1");
    expect(parsed.skills.length).toBeGreaterThan(0);
    expect(parsed.sourceRepository).toBe("https://github.com/BjornMelin/dev-skills");
  });

  it("rejects non-https catalog source URLs", () => {
    const unsafeSourceRepository = buildGeneratedCatalog({
      sourceRepository: "http://example.com/dev-skills",
    });
    const unsafeDirectory = buildGeneratedCatalogWithSourceUrls({
      directory: "javascript:alert(1)",
    });
    const unsafeSkillMd = buildGeneratedCatalogWithSourceUrls({
      skillMd: "http://example.com/SKILL.md",
    });

    expect(agentSkillsCatalogSchema.safeParse(unsafeSourceRepository).success).toBe(false);
    expect(agentSkillsCatalogSchema.safeParse(unsafeDirectory).success).toBe(false);
    expect(agentSkillsCatalogSchema.safeParse(unsafeSkillMd).success).toBe(false);
  });
});
