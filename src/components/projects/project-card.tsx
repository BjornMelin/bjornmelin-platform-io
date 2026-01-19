import Image from "next/image";
import Link from "next/link";
import { TechBadge } from "@/components/shared/tech-badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  className?: string;
}

/**
 * Card component showing a project summary.
 *
 * @param props Component properties.
 * @returns Project card element.
 */
export function ProjectCard({ project, className }: ProjectCardProps) {
  const maxVisibleTech = 4;
  const visibleTech = project.technologies.slice(0, maxVisibleTech);
  const hiddenTech = project.technologies.slice(maxVisibleTech);
  const hiddenCount = hiddenTech.length;

  return (
    <div
      data-testid="project-card"
      className={cn("bg-card rounded-lg shadow-lg overflow-hidden", className)}
    >
      <div className="relative h-48">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 360px"
          className="object-cover duration-300 motion-safe:transition-transform motion-safe:hover:scale-105"
        />
      </div>
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-balance break-words text-xl font-semibold mb-2">{project.title}</h3>
          {project.featured && (
            <div className="inline-block rounded-full bg-primary/10 px-2 py-1 text-xs text-primary mb-2">
              Featured Project
            </div>
          )}
          <p className="text-muted-foreground break-words">{project.description}</p>
        </div>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            {visibleTech.map((tech) => (
              <TechBadge key={tech} name={tech} size="sm" />
            ))}
          </div>
          {hiddenCount > 0 ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-border/60 bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-muted/80 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={`Show ${hiddenCount} more technologies`}
                  title="Show all technologies"
                >
                  +{hiddenCount}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" side="top" align="start">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Technologies
                  </p>
                  <div className="max-h-40 overflow-auto pr-1">
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <TechBadge key={tech} name={tech} size="sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
        <div className="flex gap-4 pt-2">
          {project.links.github && (
            <Button variant="outline" asChild>
              <Link href={project.links.github} target="_blank" rel="noopener noreferrer">
                GitHub
              </Link>
            </Button>
          )}
          {project.links.live && (
            <Button asChild>
              <Link href={project.links.live} target="_blank" rel="noopener noreferrer">
                Live Demo
              </Link>
            </Button>
          )}
          {project.links.demo && (
            <Button asChild>
              <Link href={project.links.demo} target="_blank" rel="noopener noreferrer">
                Demo
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
