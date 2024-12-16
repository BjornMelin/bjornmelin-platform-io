"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Loader2 } from "lucide-react";
import { BlogSearch } from "@/components/blog/blog-search";
import { BlogFilters } from "@/components/blog/blog-filters";
import { BlogGrid } from "@/components/blog/blog-grid";
import { Button } from "@/components/ui/button";

interface BlogFilters {
  search: string;
  tag: string | null;
}

export function BlogList() {
  const [filters, setFilters] = useState<BlogFilters>({
    search: "",
    tag: null,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.blog.getAll.useInfiniteQuery(
      {
        limit: 9,
        search: filters.search || undefined,
        tag: filters.tag || undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchOnWindowFocus: false,
      }
    );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4">
        <BlogSearch
          onSearch={(term) => setFilters((f) => ({ ...f, search: term }))}
        />
        <BlogFilters
          selectedTag={filters.tag}
          onTagSelect={(tag) => setFilters((f) => ({ ...f, tag }))}
        />
      </div>

      <BlogGrid posts={data?.pages.flatMap((page) => page.items) ?? []} />

      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Posts"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
