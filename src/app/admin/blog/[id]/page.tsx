import { notFound } from "next/navigation";
import { PostEditor } from "@/components/blog/admin/post-editor";
import { Suspense } from "react";
import { PostEditorSkeleton } from "@/components/blog/admin/post-editor/post-editor-skeleton";

async function getPost(id: string) {
  try {
    const response = await fetch(`/api/posts/${id}`, { 
      cache: "no-store" 
    });
    if (!response.ok) throw new Error("Failed to fetch post");
    return response.json();
  } catch (error) {
    return null;
  }
}

interface PageProps {
  params: {
    id: string;
  };
}

export default async function PostEditorPage({ params }: PageProps) {
  const post = await getPost(params.id);
  
  if (!post) {
    notFound();
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Suspense fallback={<PostEditorSkeleton />}>
        <PostEditor post={post} />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const post = await getPost(params.id);
  
  if (!post) {
    return {
      title: "Post Not Found | Blog Admin",
    };
  }

  return {
    title: `Edit: ${post.title} | Blog Admin`,
  };
} 