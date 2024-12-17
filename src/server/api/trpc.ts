import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type NextRequest } from "next/server";
import { getServerSession, type DefaultSession } from "next-auth";
import { isAdmin } from "@/lib/utils/blog";
import { prisma } from "@/server/db";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// Create context with type safety
export const createTRPCContext = async (opts: { req: NextRequest }) => {
  const session = await getServerSession();
  const user = session?.user;

  return {
    req: opts.req,
    session,
    user,
    prisma,
  };
};

// Initialize TRPC
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

// Create base router and procedures
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Middleware to check auth
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

// Middleware to check admin status
const enforceUserIsAdmin = enforceUserIsAuthed.unstable_pipe(
  ({ ctx, next }) => {
    if (!isAdmin(ctx.user)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  }
);

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const adminProcedure = t.procedure.use(enforceUserIsAdmin);
