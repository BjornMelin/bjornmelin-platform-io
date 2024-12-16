import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";

interface BlogFiltersProps {
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

export function BlogFilters({ selectedTag, onTagSelect }: BlogFiltersProps) {
  const { data: tags } = trpc.blog.getTags.useQuery();

  if (!tags?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={selectedTag === null ? "default" : "outline"}
        className="cursor-pointer"
        onClick={() => onTagSelect(null)}
      >
        All
      </Badge>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant={selectedTag === tag ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onTagSelect(tag)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
}
