import { z } from 'zod';

export const blogPostSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters"),
  excerpt: z
    .string()
    .max(300, "Excerpt must be less than 300 characters"),
  tags: z
    .array(z.string())
    .min(1, "At least one tag is required")
    .max(5, "Maximum 5 tags allowed"),
  coverImage: z.string().url().optional(),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  seoMetadata: z.object({
    title: z.string().max(60),
    description: z.string().max(160),
    keywords: z.array(z.string()).max(10),
  }),
});

export const blogQuerySchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  authorId: z.string().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
}); 