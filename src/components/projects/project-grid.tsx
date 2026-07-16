"use client";

/** Interactive projects grid with URL-synced search, filtering, and sorting. */

import { Search, X } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { filterProjects, sortProjects } from "@/lib/projects/filtering";
import {
  type ProjectsQueryState,
  type ProjectsSort,
  projectsQueryParsers,
} from "@/lib/projects/query-state";
import { cn } from "@/lib/utils";
import type { ProjectCardModel } from "@/types/project";
import { ProjectCard } from "./project-card";

interface ProjectGridProps {
  projects: ProjectCardModel[];
  categories: string[];
  languages: string[];
  className?: string;
}

/**
 * Render a grid of projects with URL-synced search, filters, and sorting.
 *
 * @param projects - Collection of projects to render.
 * @param categories - Category labels for the category filter.
 * @param languages - Language labels for the language filter.
 * @param className - Optional additional class names for outer container.
 * @returns Filterable/sortable projects grid.
 */
export function ProjectGrid({ projects, categories, languages, className }: ProjectGridProps) {
  const [{ q, category, lang, minStars, sort }, setQuery] = useQueryStates(projectsQueryParsers);
  const normalizedLang = lang.toLowerCase();
  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...categories.map((value) => ({ value, label: value })),
  ];
  const languageOptions = [
    { value: "all", label: "All languages" },
    ...languages.map((label) => ({ value: label.toLowerCase(), label })),
  ];
  const minimumStarOptions = [
    { value: "0", label: "Any" },
    { value: "10", label: "10+" },
    { value: "25", label: "25+" },
    { value: "50", label: "50+" },
    { value: "100", label: "100+" },
  ];
  const sortOptions = [
    { value: "stars", label: "Stars" },
    { value: "updated", label: "Recently Updated" },
    { value: "name", label: "Name" },
  ] as const satisfies ReadonlyArray<{ value: ProjectsSort; label: string }>;
  const consumeQueryUpdate = (promise: ReturnType<typeof setQuery>) => {
    promise.then(
      () => undefined,
      () => undefined,
    );
  };
  const updateQuery = (value: Partial<ProjectsQueryState>) => {
    consumeQueryUpdate(setQuery(value));
  };
  const clearQuery = () => {
    consumeQueryUpdate(setQuery(null));
  };

  const filtered = filterProjects(projects, { q, category, lang: normalizedLang, minStars });
  const sorted = sortProjects(filtered, sort);

  const isDirty =
    q !== "" ||
    category !== "all" ||
    normalizedLang !== "all" ||
    minStars !== 0 ||
    sort !== "stars";

  return (
    <div className={cn("space-y-8", className)}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-5">
            <label htmlFor="projects-search" className="sr-only">
              Search projects
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="projects-search"
                name="q"
                type="search"
                value={q}
                onChange={(event) => {
                  updateQuery({ q: event.target.value });
                }}
                placeholder="Search projects…"
                className="h-11 pl-9 md:h-9"
                inputMode="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="search"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="projects-category" className="sr-only">
              Category
            </label>
            <Select
              value={category}
              items={categoryOptions}
              onValueChange={(value) => {
                if (value !== null) updateQuery({ category: value });
              }}
            >
              <SelectTrigger
                id="projects-category"
                aria-label="Filter by category"
                className="h-11 md:h-9"
              >
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="projects-language" className="sr-only">
              Language
            </label>
            <Select
              value={normalizedLang}
              items={languageOptions}
              onValueChange={(value) => {
                if (value !== null) updateQuery({ lang: value });
              }}
            >
              <SelectTrigger
                id="projects-language"
                aria-label="Filter by language"
                className="h-11 md:h-9"
              >
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1">
            <label htmlFor="projects-stars" className="sr-only">
              Minimum stars
            </label>
            <Select
              value={String(minStars)}
              items={minimumStarOptions}
              onValueChange={(value) => {
                const option = minimumStarOptions.find((item) => item.value === value);
                if (option) updateQuery({ minStars: Number(option.value) });
              }}
            >
              <SelectTrigger
                id="projects-stars"
                aria-label="Filter by minimum stars"
                className="h-11 md:h-9"
              >
                <SelectValue placeholder="Stars" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {minimumStarOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="projects-sort" className="sr-only">
              Sort
            </label>
            <Select
              value={sort}
              items={sortOptions}
              onValueChange={(value) => {
                if (value !== null) updateQuery({ sort: value });
              }}
            >
              <SelectTrigger id="projects-sort" aria-label="Sort projects" className="h-11 md:h-9">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{sorted.length}</span> of{" "}
            <span className="font-medium text-foreground">{projects.length}</span> projects
          </p>

          <div className="flex items-center gap-3">
            {isDirty ? (
              <Button
                variant="outline"
                onClick={clearQuery}
                aria-label="Clear Filters"
                className="h-11 md:h-9"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        <Separator aria-hidden="true" />
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects match the current filters.</p>
          {isDirty ? (
            <div className="mt-4">
              <Button variant="outline" onClick={clearQuery}>
                Clear Filters
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sorted.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
