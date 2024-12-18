import { unstable_cache } from "next/cache";
import type { BlogPost, BlogPostQuery } from "@/types/blog";
import { prisma } from "@/server/db";
import { formatPostResponse, formatPostsResponse } from "@/lib/utils/response";
import { Prisma } from "@prisma/client";

export const getCachedPost = unstable_cache(
  async (slug: string): Promise<BlogPost | null> => {
    const post = await prisma.post.findUnique({
      where: { slug },
    });

    return post ? formatPostResponse(post) : null;
  },
  ["post"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["post"],
  }
);

export const getCachedPosts = unstable_cache(
  async (query: BlogPostQuery) => {
    const {
      limit = 10,
      cursor,
      tag,
      search,
      featured,
      published = true,
    } = query;

    const where: Prisma.PostWhereInput = {
      published,
      ...(featured && { featured: true }),
      ...(tag && { tags: { has: tag } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { excerpt: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        take: limit + 1,
        orderBy: { publishedAt: "desc" },
        cursor: cursor ? { id: cursor } : undefined,
      }),
      prisma.post.count({ where }),
    ]);

    return {
      items: formatPostsResponse(posts.slice(0, limit)),
      nextCursor: posts.length > limit ? posts[limit - 1].id : undefined,
      totalCount,
    };
  },
  ["posts"],
  {
    revalidate: 60, // Cache for 1 minute
    tags: ["posts"],
  }
);
