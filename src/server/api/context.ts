// src/server/api/context.ts
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getServerSession, Session } from "next-auth";
import { prisma } from "../db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type CreateContextOptions = {
  session: Session | null;
};

/**
 * Inner context. Will always be available in your procedures, even if
 * they are not protected (e.g., public procedures).
 */
export const createContextInner = async (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;
  const session = await getServerSession(req, res, authOptions);

  return await createContextInner({
    session,
  });
};

export type Context = Awaited<ReturnType<typeof createContext>>;
