import type { MetadataRoute } from "next";
import { agentSkillsData } from "@/data/agent-skills";

/** Enforces static rendering for sitemap generation. */
export const dynamic = "force-static";

const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bjornmelin.io";
const baseUrl = /^https?:\/\//.test(rawBaseUrl) ? rawBaseUrl : `https://${rawBaseUrl}`;

/**
 * Generates the public sitemap for static export.
 * @returns Sitemap entries for static pages and Agent Skills Lab detail pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/about", "/projects", "/agent-skills", "/contact"].map((route) => {
    const url = new URL(route, baseUrl).toString();
    return {
      url,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly" as const,
      priority: route === "/" ? 1 : 0.8,
    };
  });

  const agentSkillRoutes = agentSkillsData.map((skill) => ({
    url: new URL(skill.detailHref, baseUrl).toString(),
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: skill.featured ? 0.7 : 0.6,
  }));

  return [...staticRoutes, ...agentSkillRoutes];
}
