import { Metadata } from "next";
import { BlogHeader } from "@/components/blog/blog-header";
import { SearchAndFilters } from "@/components/blog/search-and-filters";
import { BlogGrid } from "@/components/blog/blog-grid";
import { BlogErrorBoundary } from "@/components/blog/error-boundary";

export const metadata: Metadata = {
  title: "Blog | Platform.io",
  description: "Thoughts on cloud architecture, AI/ML, and modern development",
};

export default async function BlogPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <BlogErrorBoundary>
        <BlogHeader />
        <SearchAndFilters />
        <BlogGrid />
      </BlogErrorBoundary>
    </main>
  );
}
