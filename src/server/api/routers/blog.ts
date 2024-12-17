import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { blogPostSchema, blogQuerySchema } from "@/lib/schemas/blog";
import {
  generateSlug,
  calculateReadingTime,
  isAdmin,
  DatabaseError,
  ValidationError,
} from "@/lib/utils/blog";
import { type Post } from ".prisma/client";
import { type BlogPost } from "@/types/blog";

export const blogRouter = createTRPCRouter({
  // Public Procedures
  getAll: publicProcedure.input(blogQuerySchema).query(
    async ({
      input,
      ctx,
    }): Promise<{
      items: BlogPost[];
      nextCursor?: string;
      totalCount: number;
    }> => {
      const { limit, cursor, tag, search, featured, published = true } = input;

      try {
        const [posts, totalCount] = await Promise.all([
          ctx.prisma.post.findMany({
            take: limit + 1,
            where: {
              published,
              ...(featured && { featured: true }),
              ...(tag && { tags: { has: tag } }),
              ...(search && {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { content: { contains: search, mode: "insensitive" } },
                ],
              }),
            },
            orderBy: { publishedAt: "desc" },
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
          }),
          ctx.prisma.post.count({ where: { published } }),
        ]);

        let nextCursor: string | undefined;
        if (posts.length > limit) {
          const nextItem = posts.pop();
          nextCursor = nextItem?.id;
        }

        const formattedPosts: BlogPost[] = posts.map(
          (post: {
            publishedAt: Date;
            updatedAt: Date;
            content: string;
            [key: string]: unknown;
          }) => ({
            ...post,
            publishedAt: post.publishedAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            readingTime: `${calculateReadingTime(post.content)} min`,
          })
        );

        return {
          items: formattedPosts,
          nextCursor,
          totalCount,
        };
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch posts",
          });
        }
        throw error;
      }
    }
  ),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }): Promise<BlogPost> => {
      const post = await ctx.prisma.post.findUnique({
        where: { slug: input.slug },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      return {
        ...post,
        publishedAt: post.publishedAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        readingTime: `${calculateReadingTime(post.content)} min`,
      };
    }),

  // Protected Procedures
  create: protectedProcedure
    .input(blogPostSchema)
    .mutation(async ({ input, ctx }): Promise<BlogPost> => {
      if (!isAdmin(ctx.session.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create posts",
        });
      }

      try {
        const slug = generateSlug(input.title);
        const now = new Date();

        const post = await ctx.prisma.post.create({
          data: {
            ...input,
            slug,
            readingTime: `${calculateReadingTime(input.content)} min`,
            author: {
              name: ctx.session.user.name ?? "Anonymous",
              image: ctx.session.user.image ?? "",
              bio: "Author bio", // Required by BlogPost type
            },
            publishedAt: now,
            updatedAt: now,
          },
        });

        return {
          ...post,
          publishedAt: post.publishedAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        };
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid input data",
          });
        }
        throw error;
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        tags: z.array(z.string()).optional(),
        published: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }): Promise<BlogPost> => {
      if (!isAdmin(ctx.session.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update posts",
        });
      }

      const existingPost = await ctx.prisma.post.findUnique({
        where: { id: input.id },
      });

      if (!existingPost) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      try {
        const { id, ...data } = input;
        const updatedPost = await ctx.prisma.post.update({
          where: { id },
          data: {
            ...data,
            ...(data.content && {
              readingTime: `${calculateReadingTime(data.content)} min`,
            }),
            ...(data.title && {
              slug: generateSlug(data.title),
            }),
            ...(data.published && {
              publishedAt: existingPost.publishedAt || new Date(),
            }),
            updatedAt: new Date(),
          },
        });

        return {
          ...updatedPost,
          publishedAt: updatedPost.publishedAt.toISOString(),
          updatedAt: updatedPost.updatedAt.toISOString(),
        };
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid input data",
          });
        }
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!isAdmin(ctx.session.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete posts",
        });
      }

      await ctx.prisma.post.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Additional Procedures
  getTags: publicProcedure.query(async ({ ctx }): Promise<string[]> => {
    const posts = await ctx.prisma.post.findMany({
      select: { tags: true },
      where: { published: true },
    });

    return Array.from(
      new Set(posts.flatMap((post: { tags: string[] }) => post.tags))
    );
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdmin(ctx.session.user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view stats",
      });
    }

    const [totalPosts, publishedPosts, draftPosts] = await Promise.all([
      ctx.prisma.post.count(),
      ctx.prisma.post.count({ where: { published: true } }),
      ctx.prisma.post.count({ where: { published: false } }),
    ]);

    return { totalPosts, publishedPosts, draftPosts };
  }),

  getFeatured: publicProcedure.query(async ({ ctx }): Promise<BlogPost[]> => {
    const posts = await ctx.prisma.post.findMany({
      where: {
        published: true,
        featured: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
    });

    return posts.map(
      (post: Post): BlogPost => ({
        ...post,
        publishedAt: post.publishedAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        readingTime: calculateReadingTime(post.content).toString(),
        author: post.author as BlogPost["author"],
        featured: true,
      })
    );
  }),

  getRecent: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(10).default(5) }))
    .query(async ({ ctx, input }): Promise<BlogPost[]> => {
      const posts = await ctx.prisma.post.findMany({
        where: {
          published: true,
        },
        orderBy: { publishedAt: "desc" },
        take: input.limit,
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

  togglePublish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }): Promise<BlogPost> => {
      if (!isAdmin(ctx.session.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can toggle post publication status",
        });
      }

      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const updatedPost = await ctx.prisma.post.update({
        where: { id: input.id },
        data: {
          published: !post.published,
          publishedAt: !post.published ? new Date() : post.publishedAt,
        },
      });

      return {
        ...updatedPost,
        publishedAt: updatedPost.publishedAt.toISOString(),
        updatedAt: updatedPost.updatedAt.toISOString(),
        readingTime: calculateReadingTime(updatedPost.content),
      };
    }),

  toggleFeatured: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }): Promise<BlogPost> => {
      if (!isAdmin(ctx.session.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can toggle featured status",
        });
      }

      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const updatedPost = await ctx.prisma.post.update({
        where: { id: input.id },
        data: {
          featured: !post.featured,
        },
      });

      return {
        ...updatedPost,
        publishedAt: updatedPost.publishedAt.toISOString(),
        updatedAt: updatedPost.updatedAt.toISOString(),
        readingTime: calculateReadingTime(updatedPost.content),
      };
    }),
});
