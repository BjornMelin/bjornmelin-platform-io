"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { processContent } from "@/lib/utils/content-processor";

export function TableOfContents({ content }: { content: string }) {
  const [activeId, setActiveId] = useState<string>();
  const [headings, setHeadings] = useState<
    Array<{ id: string; text: string; level: number }>
  >([]);

  useEffect(() => {
    void processContent(content).then((processed) =>
      setHeadings(processed.headings)
    );
  }, [content]);

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav className="space-y-2">
      <h2 className="font-semibold mb-4">Table of Contents</h2>
      {headings.map(({ id, text, level }) => (
        <a
          key={id}
          href={`#${id}`}
          className={cn(
            "block text-sm text-muted-foreground hover:text-foreground transition-colors",
            level === 2 ? "pl-0" : "pl-4",
            activeId === id && "text-foreground font-medium"
          )}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(id)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          {text}
        </a>
      ))}
    </nav>
  );
}
