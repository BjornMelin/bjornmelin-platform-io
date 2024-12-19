import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCachedPost } from "@/lib/cache";
import { PostHeader } from "@/components/blog/post-header";
import { PostContent } from "@/components/blog/post-content";
import { PostFooter } from "@/components/blog/post-footer";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ScrollProgress } from "@/components/blog/scroll-progress";
import {
  PostContentSkeleton,
  PostFooterSkeleton,
  TableOfContentsSkeleton,
} from "@/components/blog/loading-states";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getCachedPost(params.slug);
  if (!post) return {};

  const ogImage = post.coverImage || "/images/blog-og.jpg";

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: [{ url: ogImage, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getCachedPost(params.slug);
  if (!post) notFound();

  return (
    <>
      <ScrollProgress />
      <article className="container max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8">
          <div className="space-y-8">
            <PostHeader post={post} />
            <Suspense fallback={<PostContentSkeleton />}>
              <PostContent content={post.content} />
            </Suspense>
            <Suspense fallback={<PostFooterSkeleton />}>
              <PostFooter post={post} />
            </Suspense>
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <Suspense fallback={<TableOfContentsSkeleton />}>
                <TableOfContents content={post.content} />
              </Suspense>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
