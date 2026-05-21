import type { AgentSkillsCatalogResources } from "@/lib/schemas/agent-skills-catalog";

/** Public readiness labels generated for Agent Skills Lab entries. */
export type AgentSkillReadinessLabel =
  | "Valid"
  | "Packaged"
  | "Documented"
  | "Resource-rich"
  | "Emerging";

/** UI-ready install commands for a public Agent Skills Lab entry. */
export type AgentSkillInstallCommands = {
  codexGlobal: string;
  codexProject: string;
  allAgents: string;
};

/** UI-ready source links for a public Agent Skills Lab entry. */
export type AgentSkillSourceLinks = {
  directory: string;
  skillMd: string;
};

/** UI-ready package metadata for a public Agent Skills Lab entry. */
export type AgentSkillPackageStatus = {
  path: string;
  present: boolean;
  rejected: boolean;
};

/** UI-ready skill card and detail data derived from the generated catalog artifact. */
export type AgentSkillCardModel = {
  name: string;
  slug: string;
  description: string;
  category: string;
  license?: string;
  path: string;
  skillMdPath: string;
  detailHref: string;
  sourceLinks: AgentSkillSourceLinks;
  installCommands: AgentSkillInstallCommands;
  readinessLabels: AgentSkillReadinessLabel[];
  qualitySignals: string[];
  improvementSignals: string[];
  resources: AgentSkillsCatalogResources;
  packageStatus: AgentSkillPackageStatus;
  featured: boolean;
  score: number;
};

/** Metadata about the generated Agent Skills Lab catalog artifact. */
export type AgentSkillsMetadata = {
  generatedAt: string;
  sourceRepository: string;
  sourceCommit: string;
  skillsCount: number;
  validSkillsCount: number;
  totalSkillDirectories: number;
  packagedCount: number;
  installCommands: {
    list: string;
    installAllCodex: string;
    installAllAgents: string;
  };
};
