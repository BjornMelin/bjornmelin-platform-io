import type { MetadataRoute } from "next";

const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bjornmelin.io";
const baseUrl = /^https?:\/\//.test(rawBaseUrl) ? rawBaseUrl : `https://${rawBaseUrl}`;

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
