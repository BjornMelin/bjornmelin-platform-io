import { projectOverrides } from "@/content/projects/overrides";
import projectsGenerated from "@/content/projects/projects.generated.json";
import { deriveCategoryMap } from "@/lib/projects/filtering";
import { githubProjectsFileSchema } from "@/lib/schemas/github-projects";
import type { ProjectCardModel } from "@/types/project";

function formatDateLabelUtc(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map((value) => Number(value));
  const dateUtc = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(dateUtc);
}

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

function extractStringArrays(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const collected: string[] = [];
  for (const entry of Object.values(record)) {
    if (Array.isArray(entry) && entry.every((item) => typeof item === "string")) {
      collected.push(...entry);
    }
  }
  return collected;
}

const parsed = githubProjectsFileSchema.parse(projectsGenerated);
const categoryByProjectId = deriveCategoryMap(parsed.statistics?.topicClusters);

const anyExplicitFeatured = Object.values(projectOverrides).some(
  (override) => override.featured === true,
);

const generatedProjects = parsed.projects
  .map((project) => {
    const override = projectOverrides[project.id];
    if (override?.hide) return null;

    const repoUrl = project.url;
    const summary = project.summary ?? project.description ?? "";

    const primaryUrl = override?.primaryUrlOverride ?? project.homepage ?? project.url;

    const category = override?.categoryOverride ?? categoryByProjectId.get(project.id) ?? "Other";

    const baseTags = [...project.topics, ...extractStringArrays(project.techStack)];
    const tags = dedupeAndSort(baseTags);

    const model: ProjectCardModel = {
      id: project.id,
      title: project.name,
      description: summary,
      repoUrl,
      primaryUrl,
      liveUrl: override?.liveUrl,
      docsUrl: override?.docsUrl,

      stars: project.stars,
      forks: project.forks,
      language: project.language ?? undefined,
      license: project.license ?? undefined,

      updatedAt: project.updated,
      updatedLabel: formatDateLabelUtc(project.updated),

      topics: project.topics,
      tags,

      category,
      featured: override?.featured ?? false,

      highlights: override?.highlights,
    };

    return model;
  })
  .filter((value): value is ProjectCardModel => Boolean(value));

const featuredFallback = anyExplicitFeatured
  ? new Set<string>()
  : new Set(
      generatedProjects
        .slice()
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 3)
        .map((project) => project.id),
    );

export const projectsData: ProjectCardModel[] = generatedProjects.map((project) =>
  featuredFallback.has(project.id) ? { ...project, featured: true } : project,
);

export const projectCategories = dedupeAndSort(projectsData.map((project) => project.category));

const languageDisplayByKey = new Map<string, string>();
for (const project of projectsData) {
  if (!project.language) continue;
  const key = project.language.toLowerCase();
  if (!languageDisplayByKey.has(key)) {
    languageDisplayByKey.set(key, project.language);
  }
}

export const projectLanguages = dedupeAndSort([...languageDisplayByKey.values()]);

export const projectsMetadata = {
  generated: parsed.metadata.generated,
  total: projectsData.length,
  totalRepositories: parsed.metadata.totalRepositories,
  description: parsed.metadata.description,
} as const;
