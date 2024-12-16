import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  published: boolean;
  className?: string;
}

export function StatusBadge({ published, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={published ? "default" : "secondary"}
      className={cn(
        "text-xs",
        published && "bg-green-500/10 text-green-500 hover:bg-green-500/20",
        !published && "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
        className
      )}
    >
      {published ? "Published" : "Draft"}
    </Badge>
  );
} 