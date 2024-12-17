import RSS from "rss";
import { type NextRequest } from "next/server";
import { prisma } from "@/server/db";
import { calculateReadingTime } from "@/lib/utils/blog";
import { type BlogPost } from "@/types/blog"; // Ensure you import the BlogPost type

const CACHE_MAX_AGE = 3600; // 1 hour
const CACHE_STALE_WHILE_REVALIDATE = 18000; // 5 hours

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_BASE_URL is not defined");
    }

    const userAgent = request.headers.get("user-agent");
    console.log("User-Agent:", userAgent);

    const feed = new RSS({
      title: "Bjorn Melin's Blog",
      description:
        "Thoughts on cloud architecture, AI/ML, and modern development",
      feed_url: `${baseUrl}/api/rss`,
      site_url: baseUrl,
      language: "en",
      categories: ["Technology", "Programming", "Cloud", "AI", "ML"],
      pubDate: new Date(),
      ttl: 60,
      custom_namespaces: {
        content: "http://purl.org/rss/1.0/modules/content/",
        reading: "http://purl.org/rss/1.0/modules/reading/",
      },
    });

    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        slug: true,
        tags: true,
        publishedAt: true,
      },
    });

    posts.forEach((post: BlogPost) => {
      const readingTime = calculateReadingTime(post.content);
      feed.item({
        title: post.title,
        description: post.excerpt,
        url: `${baseUrl}/blog/${post.slug}`,
        categories: post.tags,
        author: "Bjorn Melin",
        date: post.publishedAt,
        custom_elements: [
          { "content:encoded": post.content },
          { "reading:time": readingTime },
        ],
        guid: post.id,
      });
    });

    return new Response(feed.xml({ indent: true }), {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_STALE_WHILE_REVALIDATE}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("RSS feed generation error:", error);
    return new Response("Error generating RSS feed", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
