import { createTRPCRouter } from "./trpc";
import { exampleRouter } from "./routers/example";
import { contactRouter } from "./routers/contact";
import { blogRouter } from "./routers/blog";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  contact: contactRouter,
  blog: blogRouter,
});

export type AppRouter = typeof appRouter;
