import { type ParserMap, parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs/server";

/** Supported sort keys for projects list ordering. */
export const projectsSortValues = ["stars", "updated", "name"] as const;
/** Union type for supported projects sort values. */
export type ProjectsSort = (typeof projectsSortValues)[number];

/** Query param parsers and defaults for projects list state. */
export const projectsQueryParsers = {
  q: parseAsString.withDefault("").withOptions({ history: "replace", scroll: false }),
  category: parseAsString.withDefault("all").withOptions({ scroll: false }),
  lang: parseAsString.withDefault("all").withOptions({ scroll: false }),
  minStars: parseAsInteger.withDefault(0).withOptions({ scroll: false }),
  sort: parseAsStringEnum([...projectsSortValues] as ProjectsSort[])
    .withDefault("stars")
    .withOptions({ scroll: false }),
} satisfies ParserMap;

/** URL-synced query state for projects list filters and sorting. */
export type ProjectsQueryState = {
  q: string;
  category: string;
  lang: string;
  minStars: number;
  sort: ProjectsSort;
};
