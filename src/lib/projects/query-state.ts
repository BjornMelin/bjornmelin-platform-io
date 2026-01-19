import { type ParserMap, parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs/server";

export const projectsSortValues = ["stars", "updated", "name"] as const;
export type ProjectsSort = (typeof projectsSortValues)[number];

export const projectsQueryParsers = {
  q: parseAsString.withDefault("").withOptions({ history: "replace", scroll: false }),
  category: parseAsString.withDefault("all").withOptions({ scroll: false }),
  lang: parseAsString.withDefault("all").withOptions({ scroll: false }),
  minStars: parseAsInteger.withDefault(0).withOptions({ scroll: false }),
  sort: parseAsStringEnum([...projectsSortValues] as ProjectsSort[])
    .withDefault("stars")
    .withOptions({ scroll: false }),
} satisfies ParserMap;

export type ProjectsQueryState = {
  q: string;
  category: string;
  lang: string;
  minStars: number;
  sort: ProjectsSort;
};
