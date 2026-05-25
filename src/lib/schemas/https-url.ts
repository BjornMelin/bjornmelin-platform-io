import { z } from "zod";

/** Schema for public external URLs that must use HTTPS. */
export const httpsUrlSchema = z.url().refine((value) => new URL(value).protocol === "https:", {
  message: "Expected an https URL.",
});
