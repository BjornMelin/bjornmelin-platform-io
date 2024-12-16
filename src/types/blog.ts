export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  updatedAt: string;
  author: {
    name: string;
    image: string;
    bio: string;
  };
  coverImage?: string;
  tags: string[];
  readingTime: string;
  published?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface EditorState extends BlogPost {
  isDirty: boolean;
  validationErrors: Record<string, string>;
}

export type EditorField = keyof BlogPost;
export type EditorValue = string | boolean | string[];
