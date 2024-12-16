"use client";

import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface PreviewPanelProps {
  content: string;
}

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false,
  pedantic: false,
  smartLists: true,
  smartypants: true,
});

// Configure DOMPurify options
const purifyConfig = {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
};

export function PreviewPanel({ content }: PreviewPanelProps) {
  const htmlContent = useMemo(() => {
    const rawHtml = marked.parse(content || "");
    return DOMPurify.sanitize(rawHtml, purifyConfig);
  }, [content]);

  return (
    <div className="h-full overflow-auto bg-background p-6">
      <div 
        className="prose prose-sm dark:prose-invert max-w-[65ch] mx-auto"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
} 