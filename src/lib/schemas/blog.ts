import { z } from "zod";

export const blogPostSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  excerpt: z.string().max(300, "Excerpt must be less than 300 characters"),
  seoTitle: z
    .string()
    .max(60, "SEO title must be less than 60 characters")
    .optional(),
  seoDescription: z
    .string()
    .max(160, "SEO description must be less than 160 characters")
    .optional(),
  coverImage: z.string().url("Cover image must be a valid URL").optional(),
  tags: z
    .array(z.string())
    .min(1, "At least one tag is required")
    .max(5, "Maximum 5 tags allowed"),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export const blogQuerySchema = z.object({
  limit: z
    .number()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be less than 100")
    .default(10),
  cursor: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});
