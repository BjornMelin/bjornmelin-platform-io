import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { prisma } from "../db";
import { authOptions } from "../auth";

type CreateContextOptions = {
  session: Session | null;
  secrets: Record<string, string>;
};

/**
 * Inner context. Will always be available in your procedures, even if
 * they are not protected (e.g., public procedures).
 */
export const createContextInner = async (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
    secrets: opts.secrets,
  };
};

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async (
  opts: CreateNextContextOptions & { secrets: Record<string, string> }
) => {
  const { req, res } = opts;
  const session = await getServerSession(req, res, authOptions);

  return await createContextInner({
    session,
    secrets: opts.secrets,
  });
};

// Use Awaited<ReturnType<T>> instead of inferAsyncReturnType
export type Context = Awaited<ReturnType<typeof createContext>>;
