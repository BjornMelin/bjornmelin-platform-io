export interface BlogPost {
  id: string;              // UUID v4
  title: string;           // Post title
  slug: string;           // URL-friendly title
  content: string;        // Markdown content
  excerpt: string;        // Short description
  coverImage?: string;    // URL to image
  author: {
    name: string;
    image: string;
  };
  tags: string[];         // Array of tags
  publishedAt: Date;      // Publication date
  updatedAt: Date;        // Last update
  published: boolean;     // Draft status
  featured: boolean;      // Featured post flag
  readingTime: number;    // Estimated reading time in minutes
  seoMetadata: {
    title: string;       // SEO title
    description: string; // SEO description
    keywords: string[];  // SEO keywords
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  prevCursor?: string;
  totalCount: number;
}

export interface BlogQueryParams {
  limit?: number;
  cursor?: string;
  tag?: string;
  search?: string;
  authorId?: string;
  featured?: boolean;
  published?: boolean;
} 