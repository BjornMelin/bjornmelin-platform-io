"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { type BlogPost } from "@/types/blog";

interface RelatedPostsProps {
  postId: string;
  tags: string[];
}

export function RelatedPosts({ postId, tags }: RelatedPostsProps) {
  const { data: posts, isLoading } = trpc.search.getRelated.useQuery({
    postId,
    tags,
    limit: 3,
  });

  if (isLoading || !posts?.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Related Posts</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((post: BlogPost) => (
          <Card key={post.id} className="overflow-hidden">
            <Link
              href={`/blog/${post.slug}`}
              className="block p-4 hover:bg-muted/50"
            >
              <h3 className="font-semibold line-clamp-2">{post.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {post.excerpt}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span>{post.readingTime}</span>
                <span>•</span>
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString()}
                </time>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
