import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bjornmelin.io";
const baseUrl = /^https?:\/\//.test(rawBaseUrl) ? rawBaseUrl : `https://${rawBaseUrl}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/about", "/projects", "/contact"].map((route) => {
    const url = new URL(route, baseUrl).toString();
    return {
      url,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly" as const,
      priority: route === "/" ? 1 : 0.8,
    };
  });

  // TODO: Add dynamic routes for projects
  // const projectRoutes = projects.map((project) => ({
  //   url: `${baseUrl}/projects/${project.slug}`,
  //   lastModified: project.updatedAt,
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.6,
  // }));

  return [...staticRoutes];
}
