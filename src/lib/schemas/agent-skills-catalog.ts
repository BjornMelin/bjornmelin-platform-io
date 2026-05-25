import { z } from "zod";
import { httpsUrlSchema } from "@/lib/schemas/https-url";

/** Schema for top-level install commands in the Agent Skills Lab catalog. */
export const agentSkillsCatalogInstallCommandsSchema = z.looseObject({
  list: z.string().min(1),
  installAllCodex: z.string().min(1),
  installAllAgents: z.string().min(1),
});

/** Schema for source URLs attached to a catalogued skill. */
export const agentSkillsCatalogSourceUrlsSchema = z.looseObject({
  directory: httpsUrlSchema,
  skillMd: httpsUrlSchema,
});

/** Schema for install commands attached to a catalogued skill. */
export const agentSkillsCatalogSkillInstallCommandsSchema = z.looseObject({
  codexGlobal: z.string().min(1),
  codexProject: z.string().min(1),
  allAgents: z.string().min(1),
});

/** Schema for resource counts attached to a catalogued skill. */
export const agentSkillsCatalogResourcesSchema = z.looseObject({
  references: z.int().nonnegative(),
  scripts: z.int().nonnegative(),
  assets: z.int().nonnegative(),
  templates: z.int().nonnegative(),
  agents: z.int().nonnegative(),
  total: z.int().nonnegative(),
});

/** Schema for exposure flags attached to a catalogued skill. */
export const agentSkillsCatalogExposureSchema = z.looseObject({
  readme_catalog: z.boolean(),
  docs_index: z.boolean(),
});

/** Schema for generated package metadata attached to a catalogued skill. */
export const agentSkillsCatalogPackageSchema = z.looseObject({
  path: z.string().min(1),
  present: z.boolean(),
  rejected: z.boolean(),
});

/** Schema for an individual public Agent Skills Lab catalog entry. */
export const agentSkillsCatalogSkillSchema = z.looseObject({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  license: z.string().optional(),
  path: z.string().min(1),
  skillMdPath: z.string().min(1),
  sourceUrls: agentSkillsCatalogSourceUrlsSchema,
  installCommands: agentSkillsCatalogSkillInstallCommandsSchema,
  readinessLabels: z.array(z.string()).default(() => []),
  qualitySignals: z.array(z.string()).default(() => []),
  improvementSignals: z.array(z.string()).default(() => []),
  resources: agentSkillsCatalogResourcesSchema,
  exposure: agentSkillsCatalogExposureSchema,
  package: agentSkillsCatalogPackageSchema,
});

/** Schema for the full generated Agent Skills Lab catalog artifact. */
export const agentSkillsCatalogSchema = z.looseObject({
  schemaVersion: z.literal("agent_skills_lab_catalog.v1"),
  generatedAt: z.string().datetime({ offset: true }),
  sourceRepository: httpsUrlSchema,
  sourceCommit: z.string().regex(/^[0-9a-f]{7,40}$/i),
  skillsCount: z.int().nonnegative(),
  totalSkillDirectories: z.int().nonnegative(),
  installCommands: agentSkillsCatalogInstallCommandsSchema,
  skills: z.array(agentSkillsCatalogSkillSchema),
});

/** Inferred top-level Agent Skills Lab catalog shape. */
export type AgentSkillsCatalog = z.infer<typeof agentSkillsCatalogSchema>;
/** Inferred Agent Skills Lab skill entry shape. */
export type AgentSkillsCatalogSkill = z.infer<typeof agentSkillsCatalogSkillSchema>;
/** Inferred Agent Skills Lab resource-count shape. */
export type AgentSkillsCatalogResources = z.infer<typeof agentSkillsCatalogResourcesSchema>;
