import { type inferRouterOutputs, type inferRouterInputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;

export type PaginatedResponse<T> = {
  items: T[];
  nextCursor: string | undefined;
  prevCursor: string | undefined;
  totalItems?: number;
};

export type ApiResponse<T> = {
  data: T;
  error: string | null;
  status: number;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  publishedAt: Date;
  updatedAt: Date;
  tags: string[];
  author: {
    name: string;
    image?: string;
  };
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  demoUrl?: string;
  githubUrl?: string;
  technologies: string[];
  featured: boolean;
  publishedAt: Date;
};
