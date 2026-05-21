import { normalizeText } from "@/lib/projects/filtering";
import type { AgentSkillCardModel } from "@/types/agent-skill";
import type { AgentSkillsPackageFilter, AgentSkillsSort } from "./query-state";

/** Filter criteria for Agent Skills Lab queries. */
export type AgentSkillFilters = {
  q: string;
  category: string;
  readiness: string;
  packageState: AgentSkillsPackageFilter;
};

function skillSearchText(skill: AgentSkillCardModel): string {
  return [
    skill.name,
    skill.description,
    skill.category,
    skill.path,
    skill.readinessLabels.join(" "),
    skill.qualitySignals.join(" "),
    skill.improvementSignals.join(" "),
  ].join(" ");
}

/**
 * Filters Agent Skills Lab entries by category, readiness, package state, and text query.
 * @param skills - Array of skills to filter.
 * @param filters - Filter criteria including q, category, readiness, and package state.
 * @returns Filtered array of skills matching all criteria.
 */
export function filterAgentSkills(
  skills: AgentSkillCardModel[],
  filters: AgentSkillFilters,
): AgentSkillCardModel[] {
  const q = normalizeText(filters.q);
  const hasQuery = q.length > 0;

  return skills.filter((skill) => {
    if (filters.category !== "all" && skill.category !== filters.category) {
      return false;
    }

    if (
      filters.readiness !== "all" &&
      !skill.readinessLabels.includes(filters.readiness as never)
    ) {
      return false;
    }

    if (filters.packageState === "packaged" && !skill.packageStatus.present) {
      return false;
    }

    if (filters.packageState === "source" && skill.packageStatus.present) {
      return false;
    }

    if (!hasQuery) {
      return true;
    }

    return normalizeText(skillSearchText(skill)).includes(q);
  });
}

/**
 * Sorts Agent Skills Lab entries by the specified criterion.
 * @param skills - Array of skills to sort.
 * @param sort - Sort criterion: featured, resources, packaged, or name.
 * @returns New sorted array without mutating the original.
 */
export function sortAgentSkills(
  skills: AgentSkillCardModel[],
  sort: AgentSkillsSort,
): AgentSkillCardModel[] {
  const sorted = [...skills];
  sorted.sort((a, b) => {
    if (sort === "featured") {
      const featuredDelta = Number(b.featured) - Number(a.featured);
      if (featuredDelta !== 0) return featuredDelta;
      const scoreDelta = b.score - a.score;
      if (scoreDelta !== 0) return scoreDelta;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }

    if (sort === "resources") {
      const resourceDelta = b.resources.total - a.resources.total;
      if (resourceDelta !== 0) return resourceDelta;
      return b.score - a.score;
    }

    if (sort === "packaged") {
      const packageDelta = Number(b.packageStatus.present) - Number(a.packageStatus.present);
      if (packageDelta !== 0) return packageDelta;
      return b.score - a.score;
    }

    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
  return sorted;
}
