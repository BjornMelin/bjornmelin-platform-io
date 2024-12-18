"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { api } from "@/trpc/client";
import { BlogCard } from "./blog-card";
import { Spinner } from "@/components/ui/spinner";

interface BlogGridProps {
  page?: number;
  tag?: string;
}

export function BlogGrid({ page = 1, tag }: BlogGridProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.blog.getAll.useInfiniteQuery(
      {
        limit: 9,
        tag,
        published: true,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        initialCursor: page > 1 ? ((page - 1) * 9).toString() : undefined
      }
    );

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!data?.pages[0]?.items.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.pages.map((page, i) =>
          page.items.map((post, index) => (
            <BlogCard
              key={post.id}
              post={post}
              priority={i === 0 && index < 6}
            />
          ))
        )}
      </div>
      <div ref={ref} className="h-10" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}
    </div>
  );
}
