import { createTRPCRouter } from "./trpc";
import { contactRouter } from "./routers/contact";
import { blogRouter } from "./routers/blog";
import { mediaRouter } from "./routers/media";
import { searchRouter } from "./routers/search";

export const appRouter = createTRPCRouter({
  contact: contactRouter,
  blog: blogRouter,
  media: mediaRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
