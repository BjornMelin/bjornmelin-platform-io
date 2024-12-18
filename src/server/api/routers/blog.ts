import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { blogPostSchema, blogQuerySchema } from "@/lib/schemas/blog";
import { BlogError } from "@/lib/errors";
import { formatPostResponse } from "@/lib/utils/response";
import { getCachedPost, getCachedPosts, getCachedTags } from "@/lib/cache";
import { generateSlug } from "@/lib/utils/blog";

export const blogRouter = createTRPCRouter({
  getAll: publicProcedure.input(blogQuerySchema).query(async ({ input }) => {
    try {
      return await getCachedPosts(input);
    } catch (error) {
      if (error instanceof BlogError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
          cause: error,
        });
      }
      throw error;
    }
  }),

  getTags: publicProcedure.query(async () => {
    try {
      return await getCachedTags();
    } catch (error) {
      if (error instanceof BlogError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
          cause: error,
        });
      }
      throw error;
    }
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      try {
        const post = await getCachedPost(input.slug);
        if (!post) {
          throw new BlogError("POST_NOT_FOUND", "Post not found");
        }
        return post;
      } catch (error) {
        if (error instanceof BlogError) {
          throw new TRPCError({
            code:
              error.code === "POST_NOT_FOUND"
                ? "NOT_FOUND"
                : "INTERNAL_SERVER_ERROR",
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),

  create: protectedProcedure
    .input(blogPostSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const slug = generateSlug(input.title);
        const existingPost = await ctx.prisma.post.findUnique({
          where: {
            slug,
          },
        });

        if (existingPost) {
          throw new BlogError(
            "SLUG_EXISTS",
            "A post with this title already exists"
          );
        }

        const post = await ctx.prisma.post.create({
          data: {
            ...input,
            slug,
            author: {
              name: ctx.session.user.name ?? "Anonymous",
              image: ctx.session.user.image ?? "",
              bio: "Author bio",
            },
          },
        });

        return formatPostResponse(post);
      } catch (error) {
        if (error instanceof BlogError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: blogPostSchema.partial(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, data } = input;
        const existingPost = await ctx.prisma.post.findUnique({
          where: { id },
        });

        if (!existingPost) {
          throw new BlogError("POST_NOT_FOUND", "Post not found");
        }

        const updatedPost = await ctx.prisma.post.update({
          where: { id },
          data: {
            ...data,
            ...(data.title && { slug: generateSlug(data.title) }),
          },
        });

        return formatPostResponse(updatedPost);
      } catch (error) {
        if (error instanceof BlogError) {
          throw new TRPCError({
            code: error.code === "POST_NOT_FOUND" ? "NOT_FOUND" : "BAD_REQUEST",
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const post = await ctx.prisma.post.findUnique({
          where: { id: input.id },
        });

        if (!post) {
          throw new BlogError("POST_NOT_FOUND", "Post not found");
        }

        await ctx.prisma.post.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof BlogError) {
          throw new TRPCError({
            code:
              error.code === "POST_NOT_FOUND"
                ? "NOT_FOUND"
                : "INTERNAL_SERVER_ERROR",
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }),
});
