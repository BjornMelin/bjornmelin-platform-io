import type { ProjectCardModel } from "@/types/project";
import type { ProjectsSort } from "./query-state";

/** Maps topic cluster keys to human-readable category labels for UI display. */
export const categoryLabelByKey = {
  aiAgents: "AI Agents",
  rag: "RAG",
  webScraping: "Web Scraping",
  travelPlanning: "Travel Planning",
  llmIntegration: "LLM Integration",
  dataAnalytics: "Data Analytics",
} as const;

type TopicClusters = Record<string, string[]>;

/**
 * Normalizes text for case-insensitive, diacritic-insensitive matching.
 *
 * @param value - The string to normalize.
 * @returns The normalized string (trimmed, lowercased, diacritics removed).
 */
export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Derives a mapping of project IDs to category labels from topic clusters.
 * First cluster containing a project ID determines its category.
 *
 * @param topicClusters - Record of cluster keys to arrays of project IDs.
 * @returns Map of project ID to category label.
 */
export function deriveCategoryMap(topicClusters: TopicClusters | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!topicClusters) return map;

  for (const [clusterKey, projectIds] of Object.entries(topicClusters)) {
    const label =
      clusterKey in categoryLabelByKey
        ? categoryLabelByKey[clusterKey as keyof typeof categoryLabelByKey]
        : clusterKey;
    for (const id of projectIds) {
      if (!map.has(id)) {
        map.set(id, label);
      }
    }
  }

  return map;
}

/**
 * Filter criteria for project queries.
 * `@property` q - Search query string (normalized before matching).
 * `@property` category - Category filter ("all" disables).
 * `@property` lang - Language filter ("all" disables).
 * `@property` minStars - Minimum stars threshold.
 */
export type ProjectFilters = {
  q: string;
  category: string;
  lang: string;
  minStars: number;
};

/**
 * Filters projects by category, language, minimum stars, and text query.
 *
 * @param projects - Array of projects to filter.
 * @param filters - Filter criteria including q, category, lang, and minStars.
 * @returns Filtered array of projects matching all criteria.
 */
export function filterProjects(projects: ProjectCardModel[], filters: ProjectFilters) {
  const q = normalizeText(filters.q);
  const hasQuery = q.length > 0;
  const langKey = filters.lang.toLowerCase();

  return projects.filter((project) => {
    if (filters.category !== "all" && project.category !== filters.category) {
      return false;
    }

    if (filters.lang !== "all" && (project.language ?? "").toLowerCase() !== langKey) {
      return false;
    }

    if (project.stars < filters.minStars) {
      return false;
    }

    if (!hasQuery) {
      return true;
    }

    const haystack = normalizeText(
      [
        project.title,
        project.description,
        project.category,
        project.language ?? "",
        project.topics.join(" "),
        project.tags.join(" "),
      ].join(" "),
    );

    return haystack.includes(q);
  });
}

/**
 * Sorts projects by the specified criterion.
 *
 * @param projects - Array of projects to sort.
 * @param sort - Sort criterion: "stars", "updated", or "name".
 * @returns New sorted array (does not mutate original).
 */
export function sortProjects(projects: ProjectCardModel[], sort: ProjectsSort): ProjectCardModel[] {
  const sorted = [...projects];
  sorted.sort((a, b) => {
    if (sort === "stars") {
      const delta = b.stars - a.stars;
      if (delta !== 0) return delta;
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    }

    if (sort === "updated") {
      const aTime = Date.parse(a.updatedAt) || 0;
      const bTime = Date.parse(b.updatedAt) || 0;
      const delta = bTime - aTime;
      if (delta !== 0) return delta;
      return b.stars - a.stars;
    }

    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
  return sorted;
}
