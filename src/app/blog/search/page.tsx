import { type Metadata } from "next";
import { SearchBar } from "@/components/blog/search/search-bar";
import { SearchResults } from "@/components/blog/search/search-results";

interface SearchPageProps {
  searchParams: {
    q?: string;
    tags?: string;
  };
}

export const metadata: Metadata = {
  title: "Search Blog Posts",
  description: "Search through all blog posts",
};

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || "";
  const tags = searchParams.tags?.split(",").filter(Boolean);

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-3xl font-bold">Search Blog Posts</h1>
        <SearchBar />
      </div>

      {query && (
        <div className="space-y-4">
          <p className="text-center text-muted-foreground">
            Search results for &quot;{query}&quot;
            {tags?.length ? ` in ${tags.join(", ")}` : ""}
          </p>
          <SearchResults query={query} tags={tags} />
        </div>
      )}
    </div>
  );
}
