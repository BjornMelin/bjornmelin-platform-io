import type { MetadataRoute } from "next";
import { resolveSiteBaseUrl } from "@/lib/site-url";

export const dynamic = "force-static";

const baseUrl = resolveSiteBaseUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/*", "/admin/*"],
    },
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
  };
}
