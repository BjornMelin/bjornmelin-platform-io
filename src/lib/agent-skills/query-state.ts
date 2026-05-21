import { type ParserMap, parseAsString, parseAsStringEnum } from "nuqs/server";

/** Supported sort keys for Agent Skills Lab list ordering. */
export const agentSkillsSortValues = ["featured", "resources", "packaged", "name"] as const;
/** Union type for supported Agent Skills Lab sort values. */
export type AgentSkillsSort = (typeof agentSkillsSortValues)[number];

/** Supported package filters for Agent Skills Lab list state. */
export const agentSkillsPackageValues = ["all", "packaged", "source"] as const;
/** Union type for Agent Skills Lab package filters. */
export type AgentSkillsPackageFilter = (typeof agentSkillsPackageValues)[number];

/** Query param parsers and defaults for Agent Skills Lab list state. */
export const agentSkillsQueryParsers = {
  q: parseAsString.withDefault("").withOptions({ history: "replace", scroll: false }),
  category: parseAsString.withDefault("all").withOptions({ scroll: false }),
  readiness: parseAsString.withDefault("all").withOptions({ scroll: false }),
  packageState: parseAsStringEnum([...agentSkillsPackageValues] as AgentSkillsPackageFilter[])
    .withDefault("all")
    .withOptions({ scroll: false }),
  sort: parseAsStringEnum([...agentSkillsSortValues] as AgentSkillsSort[])
    .withDefault("featured")
    .withOptions({ scroll: false }),
} satisfies ParserMap;

/** URL-synced query state for Agent Skills Lab filters and sorting. */
export type AgentSkillsQueryState = {
  q: string;
  category: string;
  readiness: string;
  packageState: AgentSkillsPackageFilter;
  sort: AgentSkillsSort;
};
