import { PostRow } from "@/components/blog/admin/list/post-row";
import { Card } from "@/components/ui/card";

async function getPosts() {
  // TODO: Replace with actual API call
  const posts = await fetch("/api/posts").then(res => res.json());
  return posts;
}

export async function PostList() {
  const posts = await getPosts();

  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No posts yet</h3>
        <p className="text-muted-foreground">Create your first blog post to get started.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostRow key={post.id} post={post} />
      ))}
    </div>
  );
} 