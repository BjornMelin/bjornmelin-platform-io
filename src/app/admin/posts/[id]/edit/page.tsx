import { notFound, redirect } from "next/navigation";
import { PostEditor } from "@/components/blog/admin/post-editor";
import { db } from "@/server/db";
import { getServerAuthSession } from "@/server/auth";
import { isAdmin } from "@/lib/utils/blog";
import { type BlogPost } from "@/types/blog";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function PostEditPage({ params }: PageProps) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!isAdmin(session.user)) {
    notFound();
  }

  const post = await db.post.findUnique({
    where: { id: params.id },
  });

  if (!post) {
    notFound();
  }

  // Transform the post to match BlogPost type
  const blogPost: BlogPost = {
    ...post,
    publishedAt: post.publishedAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    readingTime: `${post.readingTime}`,
  };

  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] py-6">
      <PostEditor post={blogPost} />
    </div>
  );
}
