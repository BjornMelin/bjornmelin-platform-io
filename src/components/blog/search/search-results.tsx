"use client";

import { Loader2, AlertCircle } from "lucide-react";
import { BlogCard } from "@/components/blog/blog-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc/client";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { BlogPost } from "@/types/blog";

interface SearchResultsProps {
  query: string;
  tags?: string[];
}

export function SearchResults({ query, tags }: SearchResultsProps) {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = trpc.search.search.useInfiniteQuery(
    {
      query,
      tags,
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!query,
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      retry: 2,
    }
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error?.message || "Error loading search results"}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data?.pages[0]?.items.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No posts found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.pages.map((page, i) =>
          page.items.map((post: BlogPost, index: number) => (
            <BlogCard
              key={post.id}
              post={post}
              priority={i === 0 && index < 6} // Prioritize loading for first 6 items
            />
          ))
        )}
      </div>

      <div ref={ref} className="flex justify-center py-8">
        {isFetchingNextPage ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : hasNextPage ? (
          <Button
            onClick={() => fetchNextPage()}
            variant="outline"
            className="opacity-0" // Hidden button for accessibility
          >
            Load More
          </Button>
        ) : null}
      </div>
    </div>
  );
}
