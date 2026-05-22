import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentSkillDetail } from "@/components/agent-skills/agent-skill-detail";
import { agentSkillsData, getAgentSkillBySlug } from "@/data/agent-skills";

type AgentSkillDetailPageProps = {
  params: Promise<{ slug: string }>;
};

/** Disables runtime fallback generation for static export. */
export const dynamicParams = false;

/**
 * Generates all static Agent Skills Lab detail route params.
 * @returns Static route params for every catalogued skill.
 */
export function generateStaticParams() {
  return agentSkillsData.map((skill) => ({ slug: skill.slug }));
}

/**
 * Generates skill-specific route metadata.
 * @param props - Route props containing the promised slug param.
 * @returns Metadata for the selected Agent Skills Lab entry.
 */
export async function generateMetadata({ params }: AgentSkillDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const skill = getAgentSkillBySlug(slug);
  if (!skill) {
    return {
      title: "Skill not found - Bjorn Melin",
    };
  }

  return {
    title: `${skill.name} - Agent Skills Lab`,
    description: skill.description,
    alternates: {
      canonical: skill.detailHref,
    },
    openGraph: {
      title: `${skill.name} - Agent Skills Lab`,
      description: skill.description,
      url: skill.detailHref,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${skill.name} - Agent Skills Lab`,
      description: skill.description,
    },
  };
}

/**
 * Agent Skills Lab detail page for one generated skill entry.
 * @param props - Route props containing the promised slug param.
 * @returns Agent skill detail page element.
 */
export default async function AgentSkillDetailPage({ params }: AgentSkillDetailPageProps) {
  const { slug } = await params;
  const skill = getAgentSkillBySlug(slug);
  if (!skill) {
    notFound();
  }

  return <AgentSkillDetail skill={skill} />;
}
