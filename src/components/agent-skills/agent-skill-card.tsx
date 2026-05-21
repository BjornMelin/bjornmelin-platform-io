import { ArrowUpRight, Code2, FileText, PackageCheck, PackageOpen } from "lucide-react";
import Link from "next/link";
import { CommandCopyButton } from "@/components/agent-skills/command-copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentSkillCardModel } from "@/types/agent-skill";

interface AgentSkillCardProps {
  skill: AgentSkillCardModel;
  className?: string;
}

function readinessVariant(label: string): "default" | "secondary" | "outline" {
  if (label === "Packaged") return "default";
  if (label === "Resource-rich" || label === "Documented") return "secondary";
  return "outline";
}

/**
 * Renders a marketplace card for a public Agent Skills Lab entry.
 * @param skill - Skill model to render.
 * @param className - Optional additional class names for the card.
 * @returns Agent skill card element.
 */
export function AgentSkillCard({ skill, className }: AgentSkillCardProps) {
  const PackageIcon = skill.packageStatus.present ? PackageCheck : PackageOpen;

  return (
    <article
      className={cn(
        "group relative flex min-h-[22rem] flex-col rounded-lg border border-border/80 bg-background p-5",
        "transition-[border-color,transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "hover:-translate-y-1 hover:border-foreground/30 hover:bg-muted/20 motion-reduce:transform-none motion-reduce:transition-none",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{skill.category}</Badge>
            {skill.featured ? <Badge variant="secondary">Featured</Badge> : null}
          </div>
          <h3 className="text-balance text-xl font-semibold tracking-tight">
            <Link
              href={skill.detailHref}
              className="rounded-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {skill.name}
            </Link>
          </h3>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
            skill.packageStatus.present
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-border bg-muted text-muted-foreground",
          )}
          title={skill.packageStatus.present ? "Packaged skill artifact" : "Source install only"}
        >
          <PackageIcon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <p className="mt-4 line-clamp-4 text-sm leading-6 text-foreground/75">{skill.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {skill.readinessLabels.slice(0, 4).map((label) => (
          <Badge key={label} variant={readinessVariant(label)} className="font-medium">
            {label}
          </Badge>
        ))}
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-md bg-muted/50 p-3">
          <dt className="text-xs text-muted-foreground">Resources</dt>
          <dd className="font-mono text-lg tabular-nums">{skill.resources.total}</dd>
        </div>
        <div className="rounded-md bg-muted/50 p-3">
          <dt className="text-xs text-muted-foreground">Scripts</dt>
          <dd className="font-mono text-lg tabular-nums">{skill.resources.scripts}</dd>
        </div>
        <div className="rounded-md bg-muted/50 p-3">
          <dt className="text-xs text-muted-foreground">Agents</dt>
          <dd className="font-mono text-lg tabular-nums">{skill.resources.agents}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-lg border border-border/70 bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-3">
          <code className="min-w-0 break-all font-mono text-xs text-foreground/80">
            {skill.installCommands.codexGlobal}
          </code>
          <CommandCopyButton command={skill.installCommands.codexGlobal} label={skill.name} />
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <Button variant="secondary" className="h-11 rounded-full md:h-9" asChild>
          <Link href={skill.detailHref}>
            <Code2 className="h-4 w-4" aria-hidden="true" />
            Details
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full md:h-9 md:w-9"
            asChild
          >
            <Link
              href={skill.sourceLinks.skillMd}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${skill.name} SKILL.md on GitHub`}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full md:h-9 md:w-9"
            asChild
          >
            <Link
              href={skill.sourceLinks.directory}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${skill.name} source directory on GitHub`}
            >
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
