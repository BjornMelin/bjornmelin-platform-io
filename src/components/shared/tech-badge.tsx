import { cn } from "@/lib/utils";

interface TechBadgeProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Render a pill style tech badge with truncation support.
 *
 * @param props TechBadgeProps for name, size, and className.
 * @returns A styled tech badge element.
 */
export function TechBadge({ name, className, size = "md" }: TechBadgeProps) {
  const sizeClasses = {
    sm: "text-[11px] leading-5 px-2 py-0.5",
    md: "text-xs leading-5 px-2.5 py-0.5",
    lg: "text-sm leading-5 px-3 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        "border border-border/60 bg-muted/70 text-foreground/80",
        "transition-colors hover:bg-muted/80 dark:bg-muted/40 dark:text-foreground/90 dark:hover:bg-muted/60",
        "max-w-40",
        sizeClasses[size],
        className,
      )}
      title={name}
    >
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );
}
