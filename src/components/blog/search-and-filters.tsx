import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TagFilter } from "../blog/tag-filter";
import { useDebounce } from "@/hooks/use-debounce";

const POPULAR_TAGS = [
  "Cloud Architecture",
  "AI/ML",
  "Development",
  "DevOps",
  "Security",
  "Frontend",
  "Backend",
  "Database",
];

export function SearchAndFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTag = searchParams.get("tag");
  const searchTerm = searchParams.get("search") || "";

  const debouncedSearch = useDebounce((...args: unknown[]) => {
    const term = args[0] as string;
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, 300);

  const handleSearch = useCallback(
    (term: string) => {
      debouncedSearch(term);
    },
    [debouncedSearch]
  );

  const handleTagSelect = useCallback(
    (tag: string) => {
      const params = new URLSearchParams(searchParams);
      if (tag === currentTag) {
        params.delete("tag");
      } else {
        params.set("tag", tag);
      }
      router.push(`?${params.toString()}`);
    },
    [currentTag, searchParams, router]
  );

  return (
    <div className="space-y-4 mb-8">
      <Input
        type="search"
        placeholder="Search articles..."
        className="max-w-md mx-auto"
        defaultValue={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 py-4">
          {POPULAR_TAGS.map((tag) => (
            <TagFilter
              key={tag}
              tag={tag}
              isSelected={tag === currentTag}
              onSelect={handleTagSelect}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
