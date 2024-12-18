"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/trpc/client";

export function TagFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTag = searchParams.get("tag");

  const { data: tags } = api.blog.getTags.useQuery(undefined, {
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false
  });

  const handleTagClick = useCallback(
    (tag: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (currentTag === tag) {
        params.delete("tag");
      } else {
        params.set("tag", tag);
      }
      params.delete("page"); // Reset page when changing tags
      router.push(`/blog?${params.toString()}`, { scroll: false });
    },
    [currentTag, router, searchParams]
  );

  if (!tags?.length) return null;

  return (
    <ScrollArea className="max-w-full pb-4">
      <div className="flex gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant={currentTag === tag ? "default" : "outline"}
            className="cursor-pointer transition-colors hover:bg-muted"
            onClick={() => handleTagClick(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>
    </ScrollArea>
  );
}
