"use client";

import { Search, X } from "lucide-react";
import { useQueryStates } from "nuqs";
import { AgentSkillCard } from "@/components/agent-skills/agent-skill-card";
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
import { filterAgentSkills, sortAgentSkills } from "@/lib/agent-skills/filtering";
import {
  type AgentSkillsPackageFilter,
  type AgentSkillsSort,
  agentSkillsQueryParsers,
} from "@/lib/agent-skills/query-state";
import { cn } from "@/lib/utils";
import type { AgentSkillCardModel } from "@/types/agent-skill";

interface AgentSkillsGridProps {
  skills: AgentSkillCardModel[];
  categories: string[];
  readinessLabels: readonly string[];
  className?: string;
}

/**
 * Renders the searchable Agent Skills Lab catalog with URL-synced filters.
 * @param skills - Collection of skills to render.
 * @param categories - Category labels for filtering.
 * @param readinessLabels - Readiness labels for filtering.
 * @param className - Optional additional class names for the outer container.
 * @returns Filterable Agent Skills Lab catalog grid.
 */
export function AgentSkillsGrid({
  skills,
  categories,
  readinessLabels,
  className,
}: AgentSkillsGridProps) {
  const [{ q, category, readiness, packageState, sort }, setQuery] =
    useQueryStates(agentSkillsQueryParsers);

  const filtered = filterAgentSkills(skills, { q, category, readiness, packageState });
  const sorted = sortAgentSkills(filtered, sort);

  const updateQuery = (
    value: Partial<{
      q: string;
      category: string;
      readiness: string;
      packageState: AgentSkillsPackageFilter;
      sort: AgentSkillsSort;
    }>,
  ) => {
    setQuery(value).then(
      () => undefined,
      () => undefined,
    );
  };

  const clearQuery = () => {
    setQuery(null).then(
      () => undefined,
      () => undefined,
    );
  };

  const isDirty =
    q !== "" ||
    category !== "all" ||
    readiness !== "all" ||
    packageState !== "all" ||
    sort !== "featured";

  return (
    <section id="skills-catalog" className={cn("scroll-mt-24 py-20 md:py-28", className)}>
      <div className="container mx-auto px-4">
        <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-lg border border-border/80 bg-muted/30 p-5">
              <p className="text-sm font-medium text-muted-foreground">Catalog</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">{skills.length}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Generated from the public dev-skills repository with install commands, source links,
                quality signals, and resource counts.
              </p>
              <Separator className="my-5" />
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Packaged</dt>
                  <dd className="font-mono tabular-nums">
                    {skills.filter((skill) => skill.packageStatus.present).length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Featured</dt>
                  <dd className="font-mono tabular-nums">
                    {skills.filter((skill) => skill.featured).length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Categories</dt>
                  <dd className="font-mono tabular-nums">{categories.length}</dd>
                </div>
              </dl>
            </div>
          </aside>

          <div className="min-w-0 space-y-8">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                <div className="md:col-span-4">
                  <label htmlFor="agent-skills-search" className="sr-only">
                    Search skills
                  </label>
                  <div className="relative">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="agent-skills-search"
                      name="q"
                      type="search"
                      value={q}
                      onChange={(event) => updateQuery({ q: event.target.value })}
                      placeholder="Search skills..."
                      className="h-11 pl-9 md:h-10"
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
                  <label htmlFor="agent-skills-category" className="sr-only">
                    Category
                  </label>
                  <Select
                    value={category}
                    onValueChange={(value) => updateQuery({ category: value })}
                  >
                    <SelectTrigger
                      id="agent-skills-category"
                      aria-label="Filter skills by category"
                      className="h-11 md:h-10"
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
                  <label htmlFor="agent-skills-readiness" className="sr-only">
                    Readiness
                  </label>
                  <Select
                    value={readiness}
                    onValueChange={(value) => updateQuery({ readiness: value })}
                  >
                    <SelectTrigger
                      id="agent-skills-readiness"
                      aria-label="Filter skills by readiness"
                      className="h-11 md:h-10"
                    >
                      <SelectValue placeholder="Readiness" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All readiness</SelectItem>
                      {readinessLabels.map((label) => (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="agent-skills-package" className="sr-only">
                    Package status
                  </label>
                  <Select
                    value={packageState}
                    onValueChange={(value) =>
                      updateQuery({ packageState: value as AgentSkillsPackageFilter })
                    }
                  >
                    <SelectTrigger
                      id="agent-skills-package"
                      aria-label="Filter skills by package status"
                      className="h-11 md:h-10"
                    >
                      <SelectValue placeholder="Package" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All packages</SelectItem>
                      <SelectItem value="packaged">Packaged</SelectItem>
                      <SelectItem value="source">Source only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="agent-skills-sort" className="sr-only">
                    Sort
                  </label>
                  <Select
                    value={sort}
                    onValueChange={(value) => updateQuery({ sort: value as AgentSkillsSort })}
                  >
                    <SelectTrigger
                      id="agent-skills-sort"
                      aria-label="Sort skills"
                      className="h-11 md:h-10"
                    >
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="resources">Resources</SelectItem>
                      <SelectItem value="packaged">Packaged</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{sorted.length}</span> of{" "}
                  <span className="font-medium text-foreground">{skills.length}</span> skills
                </p>
                {isDirty ? (
                  <Button variant="outline" onClick={clearQuery} aria-label="Clear skill filters">
                    <X className="h-4 w-4" aria-hidden="true" />
                    Clear
                  </Button>
                ) : null}
              </div>

              <Separator />
            </div>

            {sorted.length === 0 ? (
              <div className="rounded-lg border border-border/80 p-10 text-center">
                <p className="text-muted-foreground">No skills match the current filters.</p>
                {isDirty ? (
                  <div className="mt-4">
                    <Button variant="outline" onClick={clearQuery}>
                      Clear filters
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {sorted.map((skill) => (
                  <AgentSkillCard key={skill.slug} skill={skill} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
