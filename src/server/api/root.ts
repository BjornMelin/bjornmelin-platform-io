import { createTRPCRouter } from "./trpc";
import { exampleRouter } from "./routers/example";
import { contactRouter } from "./routers/contact";
import { blogRouter } from "./routers/blog";
import { mediaRouter } from "./routers/media";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  contact: contactRouter,
  blog: blogRouter,
  media: mediaRouter,
});

export type AppRouter = typeof appRouter;
