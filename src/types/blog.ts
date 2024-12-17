export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  canonicalUrl?: string;
  coverImage?: string;
  coverImageAlt?: string;
  coverImageBlur?: string;
  published: boolean;
  featured: boolean;
  author: {
    id: string;
    name: string;
    image: string;
    bio: string;
    role?: string;
    social?: {
      twitter?: string;
      github?: string;
      linkedin?: string;
    };
  };
  tags: string[];
  category?: string;
  series?: {
    id: string;
    name: string;
    order: number;
  };
  readingTime: string;
  viewCount?: number;
  likeCount?: number;
  publishedAt: string;
  updatedAt: string;
  scheduledFor?: string;
  relatedPosts?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage?: string;
  }[];
  tableOfContents?: {
    id: string;
    text: string;
    level: number;
  }[];
  revision?: number;
  lastEditedBy?: {
    id: string;
    name: string;
  };
  codeLanguages?: string[];
  dependencies?: {
    name: string;
    version: string;
  }[];
  metadata?: Record<string, unknown>;
}

export interface CreateBlogPostInput {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  coverImage?: string;
  coverImageAlt?: string;
  published?: boolean;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateBlogPostInput {
  title?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  coverImage?: string;
  coverImageAlt?: string;
  published?: boolean;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface BlogQuery {
  limit?: number;
  cursor?: string;
  tag?: string;
  search?: string;
  featured?: boolean;
  published?: boolean;
  category?: string;
  authorId?: string;
  orderBy?: 'latest' | 'popular' | 'trending';
}

export interface BlogPaginatedResponse {
  items: BlogPost[];
  nextCursor?: string;
  totalCount: number;
  hasMore: boolean;
}

export interface EditorState extends Partial<BlogPost> {
  isDirty: boolean;
  lastSaved?: string;
  hasChanges: boolean;
  validationErrors: Record<string, string[]>;
}

export interface BlogPostWithComputed extends BlogPost {
  estimatedReadTime: number;
  formattedDate: string;
  wordCount: number;
  shareUrls: {
    twitter: string;
    linkedin: string;
    facebook: string;
  };
  hasCodeBlocks: boolean;
  headings: Array<{ id: string; text: string; level: number }>;
}

export type EditorField = keyof BlogPost;
export type EditorValue = string | boolean | string[] | number;
