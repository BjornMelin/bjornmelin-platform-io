import { router } from "./trpc";
import { contactRouter } from "./routers/contact";
import { blogRouter } from "./routers/blog";

export const appRouter = router({
  contact: contactRouter,
  blog: blogRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
