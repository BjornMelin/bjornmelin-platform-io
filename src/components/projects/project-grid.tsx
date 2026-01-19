"use client";

/**
 * @fileoverview Interactive projects grid: URL-synced search/filter/sort via nuqs.
 */

import { Search, X } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { filterProjects, sortProjects } from "@/lib/projects/filtering";
import { type ProjectsSort, projectsQueryParsers } from "@/lib/projects/query-state";
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
                  setQuery({ q: event.target.value });
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
              onValueChange={(value) => {
                setQuery({ category: value });
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
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="projects-language" className="sr-only">
              Language
            </label>
            <Select
              value={normalizedLang}
              onValueChange={(value) => {
                setQuery({ lang: value });
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
                <SelectItem value="all">All languages</SelectItem>
                {languages.map((language) => (
                  <SelectItem key={language} value={language.toLowerCase()}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1">
            <label htmlFor="projects-stars" className="sr-only">
              Minimum stars
            </label>
            <Select
              value={String(minStars)}
              onValueChange={(value) => {
                setQuery({ minStars: Number(value) });
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
                <SelectItem value="0">Any</SelectItem>
                <SelectItem value="10">10+</SelectItem>
                <SelectItem value="25">25+</SelectItem>
                <SelectItem value="50">50+</SelectItem>
                <SelectItem value="100">100+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="projects-sort" className="sr-only">
              Sort
            </label>
            <Select
              value={sort}
              onValueChange={(value) => {
                setQuery({ sort: value as ProjectsSort });
              }}
            >
              <SelectTrigger id="projects-sort" aria-label="Sort projects" className="h-11 md:h-9">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stars">Stars</SelectItem>
                <SelectItem value="updated">Recently Updated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{sorted.length}</span> of{" "}
            <span className="font-medium text-foreground">{projects.length}</span> projects
          </p>

          <div className="flex items-center gap-3">
            {isDirty ? (
              <Button
                variant="outline"
                onClick={() => setQuery(null)}
                aria-label="Clear Filters"
                className="h-11 md:h-9"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        <Separator />
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects match the current filters.</p>
          {isDirty ? (
            <div className="mt-4">
              <Button variant="outline" onClick={() => setQuery(null)}>
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
