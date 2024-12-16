"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CreatePostButton() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Untitled Post",
          content: "",
          published: false,
        }),
      });

      if (!response.ok) throw new Error("Failed to create post");

      const post = await response.json();
      router.push(`/admin/blog/${post.id}`);
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleCreate}
      disabled={isCreating}
    >
      <Plus className="h-4 w-4 mr-2" />
      New Post
    </Button>
  );
} 