import { ArrowLeft, ArrowUpRight, BookOpenText, Code2, PackageCheck, Terminal } from "lucide-react";
import Link from "next/link";
import { CommandCopyButton } from "@/components/agent-skills/command-copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { AgentSkillCardModel } from "@/types/agent-skill";

interface AgentSkillDetailProps {
  skill: AgentSkillCardModel;
}

function signalLabel(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * Renders a static detail page for one Agent Skills Lab entry.
 * @param skill - Skill model to render.
 * @returns Agent skill detail element.
 */
export function AgentSkillDetail({ skill }: AgentSkillDetailProps) {
  const commandRows = [
    ["Codex global", skill.installCommands.codexGlobal],
    ["Codex project", skill.installCommands.codexProject],
    ["All agents", skill.installCommands.allAgents],
  ] as const;
  const resourceRows = [
    ["References", skill.resources.references],
    ["Scripts", skill.resources.scripts],
    ["Assets", skill.resources.assets],
    ["Templates", skill.resources.templates],
    ["Agents", skill.resources.agents],
  ] as const;

  return (
    <main className="overflow-x-hidden">
      <section className="border-b border-border/70">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <Button
            variant="ghost"
            className="mb-8 h-11 rounded-full px-0 hover:bg-transparent md:h-10"
            asChild
          >
            <Link href="/agent-skills">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Agent Skills Lab
            </Link>
          </Button>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{skill.category}</Badge>
                {skill.packageStatus.present ? <Badge variant="secondary">Packaged</Badge> : null}
                {skill.featured ? <Badge>Featured</Badge> : null}
              </div>
              <h1 className="mt-5 text-balance text-5xl font-semibold tracking-tight md:text-7xl">
                {skill.name}
              </h1>
              <p className="mt-6 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">
                {skill.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button className="h-12 rounded-full px-6" asChild>
                  <Link
                    href={skill.sourceLinks.directory}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Source directory
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button variant="outline" className="h-12 rounded-full px-6" asChild>
                  <Link href={skill.sourceLinks.skillMd} target="_blank" rel="noopener noreferrer">
                    <BookOpenText className="h-4 w-4" aria-hidden="true" />
                    SKILL.md
                  </Link>
                </Button>
              </div>
            </div>

            <aside className="rounded-lg border border-border/80 bg-muted/30 p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
                Marketplace status
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Score</dt>
                  <dd className="font-mono text-2xl tabular-nums">{skill.score.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Resources</dt>
                  <dd className="font-mono text-2xl tabular-nums">{skill.resources.total}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Scripts</dt>
                  <dd className="font-mono text-2xl tabular-nums">{skill.resources.scripts}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Agents</dt>
                  <dd className="font-mono text-2xl tabular-nums">{skill.resources.agents}</dd>
                </div>
              </dl>
              <Separator className="my-5" />
              <div className="flex flex-wrap gap-2">
                {skill.readinessLabels.map((label) => (
                  <Badge key={label} variant={label === "Packaged" ? "default" : "outline"}>
                    {label}
                  </Badge>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-10">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h2 className="text-2xl font-semibold tracking-tight">Install commands</h2>
              </div>
              <div className="space-y-3">
                {commandRows.map(([label, command]) => (
                  <div key={label} className="rounded-lg border border-border/80 bg-muted/30 p-4">
                    <div className="mb-2 text-sm font-medium text-muted-foreground">{label}</div>
                    <div className="flex items-center justify-between gap-3">
                      <code className="min-w-0 break-all font-mono text-sm">{command}</code>
                      <CommandCopyButton command={command} label={`${skill.name} ${label}`} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-lg border border-border/80 p-5">
                <h2 className="text-xl font-semibold tracking-tight">What it does</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{skill.description}</p>
              </div>
              <div className="rounded-lg border border-border/80 p-5">
                <h2 className="text-xl font-semibold tracking-tight">When to use it</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Use this skill when the task matches its trigger language and the workflow
                  benefits from reusable instructions, scripts, references, or subagent routing.
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-border/80 p-5">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h2 className="text-lg font-semibold tracking-tight">Included resources</h2>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                {resourceRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-mono tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-lg border border-border/80 p-5">
              <h2 className="text-lg font-semibold tracking-tight">Quality signals</h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {(skill.qualitySignals.length
                  ? skill.qualitySignals
                  : ["Generated from valid SKILL.md"]
                ).map((signal) => (
                  <li key={signal} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <span>{signalLabel(signal)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
