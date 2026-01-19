import type { ProjectCardModel } from "@/types/project";
import type { ProjectsSort } from "./query-state";

export const categoryLabelByKey = {
  aiAgents: "AI Agents",
  rag: "RAG",
  webScraping: "Web Scraping",
  travelPlanning: "Travel Planning",
  llmIntegration: "LLM Integration",
  dataAnalytics: "Data Analytics",
} as const;

type TopicClusters = Record<string, string[]>;

export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "");
}

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

export type ProjectFilters = {
  q: string;
  category: string;
  lang: string;
  minStars: number;
};

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

export function sortProjects(projects: ProjectCardModel[], sort: ProjectsSort) {
  const sorted = [...projects];
  sorted.sort((a, b) => {
    if (sort === "stars") {
      const delta = b.stars - a.stars;
      if (delta !== 0) return delta;
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    }

    if (sort === "updated") {
      const delta = Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      if (delta !== 0) return delta;
      return b.stars - a.stars;
    }

    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
  return sorted;
}
