import agentSkillsGenerated from "@/content/agent-skills/agent-skills.generated.json";
import { featuredAgentSkillSlugs } from "@/content/agent-skills/featured-overrides";
import { agentSkillsCatalogSchema } from "@/lib/schemas/agent-skills-catalog";
import type {
  AgentSkillCardModel,
  AgentSkillReadinessLabel,
  AgentSkillsMetadata,
} from "@/types/agent-skill";

const parsed = agentSkillsCatalogSchema.parse(agentSkillsGenerated);
const featuredSlugs = new Set<string>(featuredAgentSkillSlugs);

const readinessLabels = ["Valid", "Packaged", "Documented", "Resource-rich", "Emerging"] as const;

function dedupeAndSort(values: string[]) {
  const seen = new Set<string>();
  const unique = values.filter((value) => {
    const key = value.trim();
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function toReadinessLabels(values: string[]): AgentSkillReadinessLabel[] {
  return values.filter((value): value is AgentSkillReadinessLabel =>
    readinessLabels.includes(value as AgentSkillReadinessLabel),
  );
}

function deriveCategory(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();
  const rules: Array<[string, string[]]> = [
    ["Research", ["research", "context", "source", "documentation"]],
    ["Frontend", ["frontend", "ui", "design", "vite", "react", "vitest", "zod"]],
    ["Agent Ops", ["codex", "agent", "subagent", "subspawn", "skill", "review"]],
    ["Infrastructure", ["aws", "docker", "vercel", "deploy", "platform"]],
    ["Data & AI", ["ai sdk", "langgraph", "llm", "notebook", "ml", "convex"]],
    ["Quality", ["test", "pytest", "audit", "security", "remediation"]],
    ["Rust", ["rust", "cli", "clap", "ratatui", "axum"]],
    ["Docs", ["docs", "readme", "adr", "spec"]],
  ];

  const match = rules.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)));
  return match?.[0] ?? "Tooling";
}

function deriveScore(skill: (typeof parsed.skills)[number], labels: AgentSkillReadinessLabel[]) {
  let score = 0;
  if (labels.includes("Valid")) score += 1;
  if (labels.includes("Packaged")) score += 3;
  if (labels.includes("Documented")) score += 1.5;
  if (labels.includes("Resource-rich")) score += 1.5;
  if (skill.exposure.docs_index) score += 1;
  if (skill.exposure.readme_catalog) score += 0.5;
  score += Math.min(skill.resources.total, 12) / 12;
  return Number(score.toFixed(2));
}

const generatedSkills = parsed.skills.map((skill) => {
  const labels = toReadinessLabels(skill.readinessLabels);
  const model: AgentSkillCardModel = {
    name: skill.name,
    slug: skill.slug,
    description: skill.description,
    category: deriveCategory(skill.name, skill.description),
    license: skill.license,
    path: skill.path,
    skillMdPath: skill.skillMdPath,
    detailHref: `/agent-skills/${skill.slug}`,
    sourceLinks: {
      directory: skill.sourceUrls.directory,
      skillMd: skill.sourceUrls.skillMd,
    },
    installCommands: {
      codexGlobal: skill.installCommands.codexGlobal,
      codexProject: skill.installCommands.codexProject,
      allAgents: skill.installCommands.allAgents,
    },
    readinessLabels: labels,
    qualitySignals: skill.qualitySignals,
    improvementSignals: skill.improvementSignals,
    resources: skill.resources,
    packageStatus: {
      path: skill.package.path,
      present: skill.package.present,
      rejected: skill.package.rejected,
    },
    featured: featuredSlugs.has(skill.slug),
    score: deriveScore(skill, labels),
  };
  return model;
});

/** Public Agent Skills Lab entries sorted for marketplace display. */
export const agentSkillsData: AgentSkillCardModel[] = generatedSkills.sort((a, b) => {
  const featuredDelta = Number(b.featured) - Number(a.featured);
  if (featuredDelta !== 0) return featuredDelta;
  const scoreDelta = b.score - a.score;
  if (scoreDelta !== 0) return scoreDelta;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
});

/** Featured Agent Skills Lab entries curated for the route hero and showcase. */
export const featuredAgentSkills = agentSkillsData.filter((skill) => skill.featured);

/** Sorted list of unique Agent Skills Lab category labels. */
export const agentSkillCategories = dedupeAndSort(agentSkillsData.map((skill) => skill.category));

/** Sorted list of readiness labels currently present in the Agent Skills Lab catalog. */
export const agentSkillReadinessLabels = readinessLabels.filter((label) =>
  agentSkillsData.some((skill) => skill.readinessLabels.includes(label)),
);

/** Metadata about the generated Agent Skills Lab catalog artifact. */
export const agentSkillsMetadata: AgentSkillsMetadata = {
  generatedAt: parsed.generatedAt,
  sourceRepository: parsed.sourceRepository,
  sourceCommit: parsed.sourceCommit,
  skillsCount: parsed.skillsCount,
  validSkillsCount: parsed.validSkillsCount,
  totalSkillDirectories: parsed.totalSkillDirectories,
  packagedCount: agentSkillsData.filter((skill) => skill.packageStatus.present).length,
  installCommands: parsed.installCommands,
};

/**
 * Finds an Agent Skills Lab entry by slug.
 * @param slug - Route slug to resolve.
 * @returns Matching skill model or undefined when absent.
 */
export function getAgentSkillBySlug(slug: string): AgentSkillCardModel | undefined {
  return agentSkillsData.find((skill) => skill.slug === slug);
}
