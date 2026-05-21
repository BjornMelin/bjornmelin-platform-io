import { ArrowRight, Boxes, Terminal } from "lucide-react";
import Link from "next/link";
import { CommandCopyButton } from "@/components/agent-skills/command-copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AgentSkillCardModel, AgentSkillsMetadata } from "@/types/agent-skill";

interface AgentSkillsHeroProps {
  featuredSkills: AgentSkillCardModel[];
  metadata: AgentSkillsMetadata;
}

/**
 * Renders the Agent Skills Lab marketplace hero and catalog proof surface.
 * @param featuredSkills - Featured skills to preview in the command surface.
 * @param metadata - Generated catalog metadata for public counts.
 * @returns Agent Skills Lab hero element.
 */
export function AgentSkillsHero({ featuredSkills, metadata }: AgentSkillsHeroProps) {
  const previewSkills = featuredSkills.slice(0, 4);

  return (
    <section className="relative overflow-hidden border-b border-border/70">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.10),transparent_55%)]"
      />
      <div className="container relative mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
          <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
            Agent Skills Lab
          </h1>
          <p className="mt-6 max-w-3xl text-balance text-lg leading-8 text-muted-foreground md:text-xl">
            A public marketplace for the Codex, AI agent, and developer automation skills I use to
            turn complex engineering work into repeatable systems.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button className="h-12 rounded-full px-6" asChild>
              <Link href="#skills-catalog">
                Browse skills
                <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/10">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-12 rounded-full px-6" asChild>
              <Link href={metadata.sourceRepository} target="_blank" rel="noopener noreferrer">
                Source repository
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-6xl rounded-[2rem] bg-foreground/[0.035] p-2 ring-1 ring-border/70">
          <div className="rounded-[1.5rem] border border-border/80 bg-background p-5 shadow-[inset_0_1px_0_hsl(var(--background)),0_24px_80px_hsl(var(--foreground)/0.08)] md:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Terminal className="h-4 w-4" aria-hidden="true" />
                  Generated catalog artifact
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="font-mono text-3xl tabular-nums">{metadata.skillsCount}</p>
                    <p className="text-xs text-muted-foreground">Skills</p>
                  </div>
                  <div>
                    <p className="font-mono text-3xl tabular-nums">{metadata.packagedCount}</p>
                    <p className="text-xs text-muted-foreground">Packaged</p>
                  </div>
                  <div>
                    <p className="font-mono text-3xl tabular-nums">{metadata.validSkillsCount}</p>
                    <p className="text-xs text-muted-foreground">Valid</p>
                  </div>
                  <div>
                    <p className="font-mono text-3xl tabular-nums">
                      {metadata.sourceCommit.slice(0, 7)}
                    </p>
                    <p className="text-xs text-muted-foreground">Source SHA</p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 rounded-lg border border-border/70 bg-muted/40 p-4 lg:w-[30rem]">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Boxes className="h-4 w-4" aria-hidden="true" />
                  Install all Codex skills
                </div>
                <div className="flex items-center justify-between gap-3">
                  <code className="min-w-0 break-all font-mono text-xs text-foreground/80">
                    {metadata.installCommands.installAllCodex}
                  </code>
                  <CommandCopyButton
                    command={metadata.installCommands.installAllCodex}
                    label="install all Codex skills"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {previewSkills.map((skill) => (
                <Link
                  key={skill.slug}
                  href={skill.detailHref}
                  className="rounded-lg border border-border/70 bg-background p-4 text-left transition-colors hover:border-foreground/30 hover:bg-muted/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{skill.name}</span>
                    {skill.packageStatus.present ? (
                      <Badge variant="secondary">Packaged</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {skill.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
