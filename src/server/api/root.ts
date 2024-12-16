import { createTRPCRouter } from "./trpc";
import { contactRouter } from "./routers/contact";
import { blogRouter } from "./routers/blog";
import { mediaRouter } from "./routers/media";

export const appRouter = createTRPCRouter({
  contact: contactRouter,
  blog: blogRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
