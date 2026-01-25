interface SectionHeaderProps {
  title: string;
  description?: string;
  alignment?: "left" | "center" | "right";
}

export function SectionHeader({ title, description, alignment = "center" }: SectionHeaderProps) {
  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className={`max-w-3xl mx-auto ${alignmentClasses[alignment]} mb-12`}>
      <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
    </div>
  );
}
