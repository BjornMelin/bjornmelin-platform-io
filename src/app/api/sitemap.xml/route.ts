import { prisma } from "@/server/db";
import { type BlogPost } from "@/types/blog";

const CACHE_MAX_AGE = 3600; // 1 hour
const CACHE_STALE_WHILE_REVALIDATE = 18000; // 5 hours

interface SitemapRoute {
  url: string;
  lastmod: string;
  changefreq:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority: number;
}

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
    }

    // Static routes with type safety
    const routes: SitemapRoute[] = [
      {
        url: baseUrl,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/blog`,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/blog/search`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: 0.8,
      },
    ];

    // Fetch only necessary fields for blog posts
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { publishedAt: "desc" },
    });

    // Generate blog post routes with type safety
    const postRoutes: SitemapRoute[] = posts.map((post: BlogPost) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastmod: new Date(post.updatedAt).toISOString(),
      changefreq: "monthly",
      priority: 0.7,
    }));

    // Combine all routes
    const allRoutes = [...routes, ...postRoutes];

    // Generate sitemap with proper XML formatting
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_STALE_WHILE_REVALIDATE}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response("Error generating sitemap", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
