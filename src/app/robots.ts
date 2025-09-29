import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://bjornmelin.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/*", "/admin/*"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
