import { Suspense } from "react";
import { Metadata } from "next";
import { BlogHeader } from "@/components/blog/blog-header";
import { TagFilter } from "@/components/blog/tag-filter";
import { BlogGrid } from "@/components/blog/blog-grid";
import { BlogErrorBoundary } from "@/components/blog/error-boundary";
import {
  BlogGridSkeleton,
  TagFilterSkeleton,
} from "@/components/blog/loading-states";

export const metadata: Metadata = {
  title: "Blog | Platform.io",
  description: "Thoughts on cloud architecture, AI/ML, and modern development",
  openGraph: {
    title: "Blog | Platform.io",
    description:
      "Thoughts on cloud architecture, AI/ML, and modern development",
    type: "website",
    url: "https://platform.io/blog",
  },
  alternates: {
    canonical: "https://platform.io/blog",
  },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string; tag?: string };
}) {
  return (
    <main className="container mx-auto px-4 py-12">
      <BlogErrorBoundary>
        <BlogHeader />
        <div className="space-y-6">
          <Suspense fallback={<TagFilterSkeleton />}>
            <TagFilter />
          </Suspense>
          <Suspense
            key={`${searchParams.page}-${searchParams.tag}`}
            fallback={<BlogGridSkeleton />}
          >
            <BlogGrid
              page={parseInt(searchParams.page ?? "1")}
              tag={searchParams.tag}
            />
          </Suspense>
        </div>
      </BlogErrorBoundary>
    </main>
  );
}
