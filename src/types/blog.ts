export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  published: boolean;
  featured: boolean;
  author: {
    name: string;
    image: string;
    bio: string;
  };
  tags: string[];
  publishedAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type BlogPostCreateInput = Omit<
  BlogPost,
  "id" | "slug" | "publishedAt" | "updatedAt"
>;
export type BlogPostUpdateInput = Partial<BlogPostCreateInput>;

export interface BlogPostsResponse {
  items: BlogPost[];
  nextCursor?: string;
  totalCount: number;
}

export interface BlogPostQuery {
  limit?: number;
  cursor?: string;
  tag?: string;
  search?: string;
  featured?: boolean;
  published?: boolean;
}
