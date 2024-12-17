import { type User } from "next-auth";
import { type BlogPost } from "@/types/blog";
import { type Post } from ".prisma/client";
import { blogPostSchema } from "@/lib/schemas/blog";

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function validatePostData(data: unknown): BlogPost {
  const result = blogPostSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  return result.data as BlogPost;
}

export function formatPostResponse(post: Post): BlogPost {
  return {
    ...post,
    publishedAt: post.publishedAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    readingTime: calculateReadingTime(post.content).toString(),
    featured: false,
    author: post.author as BlogPost["author"],
  };
}

export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.email === process.env.ADMIN_EMAIL;
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class BlogError extends Error {
  constructor(
    public code:
      | "POST_NOT_FOUND"
      | "UNAUTHORIZED"
      | "INVALID_INPUT"
      | "SERVER_ERROR",
    message: string
  ) {
    super(message);
    this.name = "BlogError";
  }
}
