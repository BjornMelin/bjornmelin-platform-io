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
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>
      {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
    </div>
  );
}
