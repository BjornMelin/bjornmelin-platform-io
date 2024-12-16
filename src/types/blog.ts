export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  updatedAt: string;
}

export interface EditorState extends BlogPost {
  isDirty: boolean;
  validationErrors: Record<string, string>;
}

export type EditorField = keyof BlogPost;
export type EditorValue = string | boolean | string[];
