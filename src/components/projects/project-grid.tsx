"use client";

/**
 * @fileoverview Interactive projects grid supporting category filters and sorting.
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";
import { ProjectCard } from "./project-card";

interface ProjectGridProps {
  projects: Project[];
  className?: string;
}

type SortBy = "featured" | "alphabetical";

const isSortBy = (value: string): value is SortBy =>
  value === "featured" || value === "alphabetical";

/**
 * Render a grid of projects with category filter chips and a sort dropdown.
 *
 * @param projects Collection of projects to render.
 * @param className Optional additional class names for outer container.
 * @returns Filterable/sortable projects grid.
 */
export function ProjectGrid({ projects, className }: ProjectGridProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((project) => project.category)))],
    [projects],
  );

  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortBy>("featured");

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const sortParam = searchParams.get("sort");

    const nextCategory =
      categoryParam && categories.includes(categoryParam) ? categoryParam : "All";
    const nextSort = sortParam && isSortBy(sortParam) ? sortParam : "featured";

    setCategory((prev) => (prev === nextCategory ? prev : nextCategory));
    setSortBy((prev) => (prev === nextSort ? prev : nextSort));
  }, [categories, searchParams]);

  const updateUrl = (nextCategory: string, nextSortBy: SortBy) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (nextCategory === "All") {
      nextSearchParams.delete("category");
    } else {
      nextSearchParams.set("category", nextCategory);
    }

    if (nextSortBy === "featured") {
      nextSearchParams.delete("sort");
    } else {
      nextSearchParams.set("sort", nextSortBy);
    }

    const queryString = nextSearchParams.toString();
    const href = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.replace(href);
    });
  };

  const filteredProjects = useMemo(() => {
    const filtered =
      category === "All" ? projects : projects.filter((project) => project.category === category);

    return filtered.slice().sort((a, b) => {
      if (sortBy === "featured") {
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
      // Use accent-insensitive sorting for consistent ordering across locales.
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    });
  }, [category, projects, sortBy]);

  return (
    <div
      className={cn("space-y-8", isPending && "opacity-70 transition-opacity", className)}
      aria-busy={isPending}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ToggleGroup
          type="single"
          value={category}
          onValueChange={(value) => {
            if (!value) {
              return;
            }
            setCategory(value);
            updateUrl(value, sortBy);
          }}
          variant="outline"
          size="sm"
          aria-label="Filter projects by category"
          className="flex flex-wrap justify-start gap-2"
        >
          {categories.map((categoryName) => (
            <ToggleGroupItem key={categoryName} value={categoryName} className="rounded-full px-3">
              {categoryName}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div>
          <Select
            value={sortBy}
            onValueChange={(value: SortBy) => {
              setSortBy(value);
              updateUrl(category, value);
            }}
          >
            <SelectTrigger className="w-[180px]" aria-label="Sort projects by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured First</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
