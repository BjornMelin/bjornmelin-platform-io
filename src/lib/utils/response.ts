import type { BlogPost } from "@/types/blog";
import type { Post } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

type PrismaPost = Post & {
  author: JsonValue;
};

export function formatPostResponse(post: PrismaPost): BlogPost {
  const author = post.author as BlogPost["author"];
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    coverImage: post.coverImage ?? undefined,
    published: post.published,
    featured: post.featured,
    author: {
      name: author.name,
      image: author.image,
      bio: author.bio,
    },
    tags: post.tags,
    publishedAt: post.publishedAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function formatPostsResponse(posts: PrismaPost[]) {
  return posts.map(formatPostResponse);
}
