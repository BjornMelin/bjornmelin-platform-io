import { useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import { useInfinitePosts } from "@/hooks/use-infinite-posts";
import { BlogCard } from "./blog-card";
import { BlogGridSkeleton } from "./loading-states";
import { useSearchParams } from "next/navigation";
import type { BlogPost } from "@/types/blog";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.1,
    },
  },
};

export function BlogGrid() {
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const orderBy = (searchParams.get("orderBy") as 'latest' | 'popular' | 'trending') || 'latest';

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "100px",
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
  } = useInfinitePosts({
    limit: 9,
    tag: tag ?? undefined,
    search: search ?? undefined,
    category: category ?? undefined,
    orderBy,
  });

  const handleFetchMore = useCallback(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    handleFetchMore();
  }, [handleFetchMore]);

  if (isLoading) {
    return <BlogGridSkeleton />;
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Failed to load posts"}
        </p>
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts found</p>
        {(tag || search || category) && (
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search or filters
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${tag}-${search}-${category}-${orderBy}`}
          variants={container}
          initial="hidden"
          animate="show"
          exit="exit"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {posts.map((post: BlogPost, index: number) => (
            <BlogCard 
              key={post.id} 
              post={post} 
              priority={index < 6} 
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <div ref={ref} className="h-10" />

      {isFetchingNextPage && (
        <div className="mt-8">
          <BlogGridSkeleton />
        </div>
      )}
    </>
  );
}
