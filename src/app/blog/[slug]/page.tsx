import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { PostContent } from "@/components/blog/post-content";
import { PostHeader } from "@/components/blog/post-header";
import { PostSidebar } from "@/components/blog/post-sidebar";
import { PostFooter } from "@/components/blog/post-footer";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

async function getPostData(slug: string) {
  // TODO: Implement actual data fetching
  // This is a placeholder - replace with your data fetching logic
  return {
    title: "Sample Blog Post",
    excerpt: "This is a sample blog post",
    content: "# Sample Content\n\nThis is the content of the blog post.",
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      name: "John Doe",
      image: "/placeholder.jpg",
    },
    tags: ["sample", "blog"],
  };
}

export async function generateMetadata(
  { params }: BlogPostPageProps
): Promise<Metadata> {
  const post = await getPostData(params.slug);
  if (!post) return {};

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
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getPostData(params.slug);
  if (!post) notFound();

  return (
    <article className="container max-w-4xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8">
        <div className="space-y-8">
          <PostHeader post={post} />
          <PostContent content={post.content} />
          <PostFooter post={post} />
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <PostSidebar content={post.content} />
          </div>
        </aside>
      </div>
    </article>
  );
} 