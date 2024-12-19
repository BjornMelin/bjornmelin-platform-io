import { createNextRouteHandler } from "uploadthing/next";
import { uploadRouter } from "@/lib/api/uploadthing";

export const { GET, POST } = createNextRouteHandler({
  router: uploadRouter,
});
