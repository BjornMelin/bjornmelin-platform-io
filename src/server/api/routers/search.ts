import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { calculateReadingTime } from "@/lib/utils/blog";
import { type Post } from ".prisma/client";
import { type BlogPost } from "@/types/blog";

export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { query, limit, cursor, tags } = input;

      const posts = await ctx.prisma.post.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { content: { contains: query, mode: "insensitive" } },
                { excerpt: { contains: query, mode: "insensitive" } },
              ],
            },
            { published: true },
            ...(tags?.length ? [{ tags: { hasEvery: tags } }] : []),
          ],
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { publishedAt: "desc" },
      });

      let nextCursor: typeof cursor | undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: posts.map(
          (post: Post): BlogPost => ({
            ...post,
            publishedAt: post.publishedAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            readingTime: calculateReadingTime(post.content).toString(),
            author: post.author as BlogPost["author"],
            featured: false,
          })
        ),
        nextCursor,
      };
    }),

  getRelated: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        limit: z.number().min(1).max(10).default(3),
        tags: z.array(z.string()),
      })
    )
    .query(async ({ input, ctx }) => {
      const { postId, limit, tags } = input;

      const posts = await ctx.prisma.post.findMany({
        where: {
          AND: [
            { id: { not: postId } },
            { published: true },
            { tags: { hasSome: tags } },
          ],
        },
        take: limit,
        orderBy: { publishedAt: "desc" },
      });

      return posts.map(
        (post: Post): BlogPost => ({
          ...post,
          publishedAt: post.publishedAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          readingTime: calculateReadingTime(post.content).toString(),
          author: post.author as BlogPost["author"],
          featured: false,
        })
      );
    }),
});
