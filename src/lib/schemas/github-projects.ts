import { z } from "zod";

/** Schema for repository metadata in the generated projects JSON. */
export const githubProjectsMetadataSchema = z.looseObject({
  generated: z.iso.date(),
  totalRepositories: z.int().nonnegative(),
  description: z.string().optional(),
  author: z.string().optional(),
  updateFrequency: z.string().optional(),
  source: z.string().optional(),
});

/** Schema for an individual GitHub project entry. */
export const githubProjectSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  url: z.url(),
  stars: z.int().nonnegative(),
  forks: z.int().nonnegative(),
  updated: z.iso.date(),
  topics: z.array(z.string()).default(() => []),

  // Optional fields used for UI enrichment.
  description: z.string().optional(),
  summary: z.string().optional(),
  homepage: z.preprocess((value) => (value === "" ? undefined : value), z.url().optional()),
  license: z.string().nullable().optional(),
  language: z.string().nullable().optional(),

  // Variable nested objects that may evolve.
  techStack: z.object({}).catchall(z.unknown()).optional(),
  architecture: z.object({}).catchall(z.unknown()).optional(),
});

/** Schema for optional statistics in the generated projects JSON. */
export const githubProjectsStatisticsSchema = z.looseObject({
  // Map cluster key -> array of project ids
  topicClusters: z.record(z.string(), z.array(z.string())).optional(),
});

/** Schema for the full generated projects JSON file. */
export const githubProjectsFileSchema = z.looseObject({
  metadata: githubProjectsMetadataSchema,
  projects: z.array(githubProjectSchema),
  statistics: githubProjectsStatisticsSchema.optional(),
});

/** Inferred metadata shape for the projects JSON. */
export type GithubProjectsMetadata = z.infer<typeof githubProjectsMetadataSchema>;
/** Inferred project shape for the projects JSON. */
export type GithubProject = z.infer<typeof githubProjectSchema>;
/** Inferred statistics shape for the projects JSON. */
export type GithubProjectsStatistics = z.infer<typeof githubProjectsStatisticsSchema>;
/** Inferred top-level projects JSON file shape. */
export type GithubProjectsFile = z.infer<typeof githubProjectsFileSchema>;
