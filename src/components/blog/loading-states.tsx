import { memo } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const GRID_ITEMS = 6;
const TAG_ITEMS = 6;

export const BlogGridSkeleton = memo(function BlogGridSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading blog posts"
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: GRID_ITEMS }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
});

const BlogCardSkeleton = memo(function BlogCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <Skeleton className="aspect-video" />
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Category */}
        <Skeleton className="h-5 w-24" />

        {/* Tags */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>

        {/* Title and Excerpt */}
        <div className="space-y-3">
          <Skeleton className="h-7 w-[90%]" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0">
        <div className="flex items-center justify-between w-full">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
});

export const SearchSkeleton = memo(function SearchSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading search interface"
      className="space-y-4 mb-8"
    >
      {/* Search input */}
      <Skeleton className="h-10 max-w-md mx-auto" />

      {/* Tags scroll area */}
      <div className="flex space-x-2 py-4 px-2 overflow-hidden">
        {Array.from({ length: TAG_ITEMS }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
});
