import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { blogPostSchema, blogQuerySchema } from '@/lib/schemas/blog';
import { generateSlug, calculateReadingTime, isAdmin, DatabaseError, ValidationError } from '@/lib/utils/blog';
import { type BlogPost } from '@/types/blog';

export const blogRouter = createTRPCRouter({
  // Public Procedures
  getAll: publicProcedure
    .input(blogQuerySchema)
    .query(async ({ input, ctx }) => {
      try {
        const { limit, cursor, tag, search, featured, published = true } = input;
        
        const posts = await ctx.db.post.findMany({
          take: limit + 1,
          where: {
            published,
            ...(featured && { featured: true }),
            ...(tag && { tags: { has: tag } }),
            ...(search && {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
              ],
            }),
          },
          orderBy: { publishedAt: 'desc' },
          ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        });

        let nextCursor: string | undefined = undefined;
        if (posts.length > limit) {
          const nextItem = posts.pop();
          nextCursor = nextItem?.id;
        }

        const totalCount = await ctx.db.post.count({
          where: { published },
        });

        return {
          items: posts,
          nextCursor,
          totalCount,
        };
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch posts',
          });
        }
        throw error;
      }
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const post = await ctx.db.post.findUnique({
        where: { slug: input.slug },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      return post;
    }),

  // Protected Procedures
  create: protectedProcedure
    .input(blogPostSchema)
    .mutation(async ({ input, ctx }) => {
      if (!isAdmin(ctx.session.user)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create posts',
        });
      }

      try {
        const slug = generateSlug(input.title);
        const readingTime = calculateReadingTime(input.content);

        const post = await ctx.db.post.create({
          data: {
            ...input,
            slug,
            readingTime,
            author: {
              name: ctx.session.user.name ?? 'Anonymous',
              image: ctx.session.user.image ?? '',
            },
            publishedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return post;
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid input data',
          });
        }
        throw error;
      }
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      ...blogPostSchema.partial(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const post = await ctx.db.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      if (!isAdmin(ctx.session.user)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update posts',
        });
      }

      const updatedPost = await ctx.db.post.update({
        where: { id },
        data: {
          ...data,
          slug: data.title ? generateSlug(data.title) : post.slug,
          readingTime: data.content ? calculateReadingTime(data.content) : post.readingTime,
          updatedAt: new Date(),
        },
      });

      return updatedPost;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!isAdmin(ctx.session.user)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete posts',
        });
      }

      await ctx.db.post.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Additional Procedures
  getTags: publicProcedure
    .query(async ({ ctx }) => {
      const posts = await ctx.db.post.findMany({
        select: { tags: true },
        where: { published: true },
      });

      const tags = new Set<string>();
      posts.forEach(post => post.tags.forEach(tag => tags.add(tag)));
      return Array.from(tags);
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (!isAdmin(ctx.session.user)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can view stats',
        });
      }

      const [totalPosts, publishedPosts, draftPosts] = await Promise.all([
        ctx.db.post.count(),
        ctx.db.post.count({ where: { published: true } }),
        ctx.db.post.count({ where: { published: false } }),
      ]);

      return {
        totalPosts,
        publishedPosts,
        draftPosts,
      };
    }),
}); 