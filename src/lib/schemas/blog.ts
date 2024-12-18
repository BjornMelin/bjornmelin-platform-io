import { z } from "zod";

export const blogPostSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must be less than 100 characters")
      .transform((str) => str.trim()),

    content: z
      .string()
      .min(10, "Content must be at least 10 characters")
      .transform((str) => str.trim()),

    excerpt: z
      .string()
      .max(300, "Excerpt must be less than 300 characters")
      .transform((str) => str.trim()),

    tags: z
      .array(z.string())
      .min(1, "At least one tag is required")
      .max(5, "Maximum 5 tags allowed")
      .transform((tags) => Array.from(new Set(tags.map((t) => t.toLowerCase())))),

    coverImage: z.string().url("Cover image must be a valid URL").optional(),

    published: z.boolean().default(false),
    featured: z.boolean().default(false),
  })
  .strict();

export const blogQuerySchema = z.object({
  limit: z.number().min(1).max(50).default(10),
  cursor: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().default(true),
});
