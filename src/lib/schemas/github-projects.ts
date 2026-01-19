import { z } from "zod";

export const githubProjectsMetadataSchema = z.looseObject({
  generated: z.string(),
  totalRepositories: z.int().nonnegative(),
  description: z.string().optional(),
  author: z.string().optional(),
  updateFrequency: z.string().optional(),
  source: z.string().optional(),
});

export const githubProjectSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  url: z.url(),
  stars: z.int().nonnegative(),
  forks: z.int().nonnegative(),
  updated: z.string(),
  topics: z.array(z.string()).default([]),

  // Optional fields used for UI enrichment.
  description: z.string().optional(),
  summary: z.string().optional(),
  homepage: z.url().optional(),
  license: z.string().nullable().optional(),
  language: z.string().nullable().optional(),

  // Variable nested objects that may evolve.
  techStack: z.object({}).catchall(z.unknown()).optional(),
  architecture: z.object({}).catchall(z.unknown()).optional(),
});

export const githubProjectsStatisticsSchema = z.looseObject({
  // Map cluster key -> array of project ids
  topicClusters: z.record(z.string(), z.array(z.string())).optional(),
});

export const githubProjectsFileSchema = z.looseObject({
  metadata: githubProjectsMetadataSchema,
  projects: z.array(githubProjectSchema),
  statistics: githubProjectsStatisticsSchema.optional(),
});

export type GithubProjectsMetadata = z.infer<typeof githubProjectsMetadataSchema>;
export type GithubProject = z.infer<typeof githubProjectSchema>;
export type GithubProjectsStatistics = z.infer<typeof githubProjectsStatisticsSchema>;
export type GithubProjectsFile = z.infer<typeof githubProjectsFileSchema>;
