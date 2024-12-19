import { Suspense } from "react";
import { PostListSkeleton } from "@/components/blog/admin/list/post-list-skeleton";
import { PostList } from "@/components/blog/admin/list/post-list";
import { CreatePostButton } from "@/components/blog/admin/shared/create-post-button";

export const metadata = {
  title: "Blog Admin | Manage Posts",
  description: "Manage your blog posts and content",
};

export default function AdminBlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog content</p>
        </div>
        <CreatePostButton />
      </div>
      
      <Suspense fallback={<PostListSkeleton />}>
        <PostList />
      </Suspense>
    </div>
  );
} 