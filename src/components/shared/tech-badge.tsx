import { cn } from "@/lib/utils";

interface TechBadgeProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function TechBadge({ name, className, size = "md" }: TechBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
        "border border-primary/20",
        sizeClasses[size],
        className,
      )}
    >
      {name}
    </span>
  );
}
