import { BookOpenText, ExternalLink, GitFork, Github, Star } from "lucide-react";
import Link from "next/link";
import { TechBadge } from "@/components/shared/tech-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ProjectCardModel } from "@/types/project";

interface ProjectCardProps {
  project: ProjectCardModel;
  className?: string;
}

/**
 * Card component showing a project summary.
 *
 * @param props Component properties.
 * @returns Project card element.
 */
export function ProjectCard({ project, className }: ProjectCardProps) {
  const maxVisibleTags = 4;
  const visibleTags = project.tags.slice(0, maxVisibleTags);
  const hiddenTags = project.tags.slice(maxVisibleTags);
  const hiddenCount = hiddenTags.length;

  return (
    <Card
      data-testid="project-card"
      className={cn(
        "group relative overflow-hidden",
        "flex flex-col",
        "transition-colors motion-reduce:transition-none",
        "hover:border-border/80 hover:bg-card/90",
        className,
      )}
    >
      <CardHeader className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"
        />
        <div className="relative flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{project.category}</Badge>
          {project.language ? <Badge variant="outline">{project.language}</Badge> : null}
          {project.featured ? <Badge>Featured</Badge> : null}
        </div>

        <CardTitle className="relative mt-3 text-balance text-lg">
          <Link
            href={project.primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 rounded-xs",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "hover:underline underline-offset-4 motion-reduce:transition-none",
            )}
          >
            <span className="break-words">{project.title}</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </Link>
        </CardTitle>

        <p className="relative mt-2 text-sm text-muted-foreground line-clamp-3">
          {project.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Star className="h-4 w-4" aria-hidden="true" />
            {project.stars.toLocaleString("en-US")}
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <GitFork className="h-4 w-4" aria-hidden="true" />
            {project.forks.toLocaleString("en-US")}
          </span>
          <span className="tabular-nums">Updated {project.updatedLabel}</span>
        </div>

        {project.highlights?.length ? (
          <ul className="space-y-1 text-sm text-foreground/90">
            {project.highlights.slice(0, 2).map((highlight) => (
              <li key={highlight} className="flex gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70"
                />
                <span className="min-w-0">{highlight}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            {visibleTags.map((tag) => (
              <TechBadge key={tag} name={tag} size="sm" />
            ))}
          </div>
          {hiddenCount > 0 ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-11 items-center rounded-full border border-border/60 bg-muted/70 px-3 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-muted/80 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:h-8 md:px-2 md:py-0.5"
                  aria-label={`Show ${hiddenCount} more tags`}
                  title="Show all tags"
                >
                  +{hiddenCount}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" side="top" align="start">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tags
                  </p>
                  <div className="max-h-44 overflow-auto pr-1">
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <TechBadge key={tag} name={tag} size="sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-11 w-11" asChild>
            <Link
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${project.title} repository on GitHub`}
            >
              <Github className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button variant="outline" className="h-11 md:h-9" asChild>
            <Link href={project.primaryUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span>Open</span>
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {project.liveUrl ? (
            <Button variant="secondary" className="h-11 md:h-9" asChild>
              <Link href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                Live
              </Link>
            </Button>
          ) : null}
          {project.docsUrl ? (
            <Button variant="outline" className="h-11 md:h-9" asChild>
              <Link href={project.docsUrl} target="_blank" rel="noopener noreferrer">
                <BookOpenText className="h-4 w-4" aria-hidden="true" />
                Docs
              </Link>
            </Button>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}
