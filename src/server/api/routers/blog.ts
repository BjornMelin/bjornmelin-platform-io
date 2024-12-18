// src/server/api/routers/blog.ts
import { publicProcedure, protectedProcedure, router } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const blogRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      include: {
        author: true,
      },
    });
  }),
  getById: publicProcedure.input(z.number()).query(async ({ ctx, input }) => {
    const post = await ctx.prisma.post.findUnique({
      where: { id: input },
      include: {
        author: true,
      },
    });
    if (!post) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return post;
  }),
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
        published: z.boolean(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "ADMIN")
        throw new TRPCError({ code: "UNAUTHORIZED" });
      const post = await ctx.prisma.post.create({
        data: { ...input, authorId: ctx.session.user.id },
      });
      return post;
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string(),
        content: z.string(),
        published: z.boolean(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== "ADMIN")
        throw new TRPCError({ code: "UNAUTHORIZED" });
      const post = await ctx.prisma.post.update({
        where: { id: input.id },
        data: input,
      });
      return post;
    }),
  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN")
        throw new TRPCError({ code: "UNAUTHORIZED" });
      return await ctx.prisma.post.delete({ where: { id: input } });
    }),
});
