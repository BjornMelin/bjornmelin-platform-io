import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

interface BlogSearchProps {
  onSearch: (term: string) => void;
}

export function BlogSearch({ onSearch }: BlogSearchProps) {
  const debouncedSearch = useDebounce(onSearch, 300);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search posts..."
        onChange={(e) => debouncedSearch(e.target.value)}
        className="pl-9 w-full sm:w-[300px]"
      />
    </div>
  );
}
