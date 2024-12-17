"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isPending, startTransition] = useTransition();

  const updateSearchParams = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      return params.toString();
    },
    [searchParams]
  );

  const debouncedSearch = useDebounce((...args: unknown[]) => {
    const value = args[0] as string;
    startTransition(() => {
      const queryString = updateSearchParams(value);
      router.push(`/blog/search?${queryString}`);
    });
  }, 300);

  const handleClear = useCallback(() => {
    setQuery("");
    startTransition(() => {
      const queryString = updateSearchParams("");
      router.push(`/blog/search?${queryString}`);
    });
  }, [router, updateSearchParams]);

  return (
    <div className="relative w-full max-w-xl">
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder="Search posts..."
        className="pl-9 pr-10"
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          debouncedSearch(value);
        }}
        aria-label="Search blog posts"
        aria-busy={isPending}
        disabled={isPending}
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
