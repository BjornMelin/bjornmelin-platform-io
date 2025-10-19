import Image from "next/image";
import Link from "next/link";
import { TechBadge } from "@/components/shared/tech-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  className?: string;
}

/**
 * Card component showing a project summary.
 *
 * @param project Project data to display.
 * @param className Optional wrapping class names.
 * @returns Project card element.
 */
export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <div className={cn("bg-card rounded-lg shadow-lg overflow-hidden", className)}>
      <div className="relative h-48">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform hover:scale-105 duration-300"
        />
      </div>
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
          {project.featured && (
            <div className="inline-block rounded-full bg-primary/10 px-2 py-1 text-xs text-primary mb-2">
              Featured Project
            </div>
          )}
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <TechBadge key={tech} name={tech} size="sm" />
          ))}
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
/**
 * @fileoverview Presentation of a single project, including image, tech stack,
 * and external links.
 */
