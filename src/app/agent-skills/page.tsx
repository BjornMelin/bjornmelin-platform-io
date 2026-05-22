import type { Metadata } from "next";
import { AgentSkillsGrid } from "@/components/agent-skills/agent-skills-grid";
import { AgentSkillsHero } from "@/components/agent-skills/agent-skills-hero";
import {
  agentSkillCategories,
  agentSkillReadinessLabels,
  agentSkillsData,
  agentSkillsMetadata,
  featuredAgentSkills,
} from "@/data/agent-skills";

/** Metadata for the Agent Skills Lab marketplace page. */
export const metadata: Metadata = {
  title: "Agent Skills Lab",
  description:
    "Browse Bjorn Melin's public marketplace of installable Codex, AI agent, and developer automation skills generated from the dev-skills repository.",
  alternates: {
    canonical: "/agent-skills",
  },
  openGraph: {
    title: "Agent Skills Lab - Bjorn Melin",
    description:
      "A public marketplace of Codex, AI agent, and developer automation skills with install commands, source links, and quality signals.",
    url: "/agent-skills",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Skills Lab - Bjorn Melin",
    description:
      "Installable Codex, AI agent, and developer automation skills generated from Bjorn Melin's dev-skills repository.",
  },
};

/**
 * Agent Skills Lab page listing public installable skills.
 * @returns Agent Skills Lab page element.
 */
export default function AgentSkillsPage() {
  return (
    <div className="overflow-x-hidden">
      <AgentSkillsHero featuredSkills={featuredAgentSkills} metadata={agentSkillsMetadata} />
      <AgentSkillsGrid
        skills={agentSkillsData}
        categories={agentSkillCategories}
        readinessLabels={agentSkillReadinessLabels}
      />
    </div>
  );
}
