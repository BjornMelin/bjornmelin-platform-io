"use client";

import { useMemo, Suspense, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';

interface PreviewPanelProps {
  content: string;
  className?: string;
}

// Helper function to escape HTML
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Configure marked options for better markdown support
const renderer = new marked.Renderer();
renderer.code = ({ text, lang, escaped }: { text: string, lang?: string, escaped?: boolean }): string => {
  const languageClass = lang ? ` language-${lang}` : '';
  
  if (escaped) {
    return `<pre><code class="block${languageClass}">${text}</code></pre>`;
  }

  let highlighted: string;
  try {
    // Only highlight if we have a language and it's supported by Prism
    if (lang && Prism.languages[lang]) {
      highlighted = Prism.highlight(
        text,
        Prism.languages[lang],
        lang
      );
    } else {
      // Fallback to escaped code if no language or unsupported
      highlighted = escapeHtml(text);
    }
  } catch (error) {
    console.error(`Failed to highlight code block: ${error}`);
    highlighted = escapeHtml(text);
  }

  return `<pre><code class="block${languageClass}">${highlighted}</code></pre>`;
};

marked.setOptions({
  gfm: true,
  breaks: true,
  pedantic: false,
  renderer: renderer,
});

// Configure DOMPurify options for safe HTML
const purifyConfig = {
  ADD_TAGS: ["iframe", "pre", "code"],
  ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "class", "language"],
  FORBID_TAGS: ["script", "style"],
  FORBID_ATTR: ["onerror", "onload", "onclick"],
};

function PreviewContent({ content }: { content: string }) {
  const htmlContent = useMemo(() => {
    try {
      const rawHtml = marked.parse(content || "", { async: false });
      return DOMPurify.sanitize(rawHtml, purifyConfig);
    } catch (error) {
      console.error("Failed to parse markdown:", error);
      return "<p>Error parsing markdown content</p>";
    }
  }, [content]);

  useEffect(() => {
    // Re-highlight code blocks after content updates
    requestAnimationFrame(() => {
      Prism.highlightAll();
    });
  }, [htmlContent]);

  return (
    <article
      className="prose prose-sm dark:prose-invert max-w-[65ch] mx-auto [&_pre]:!bg-muted [&_code]:!bg-muted"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

export function PreviewPanel({ content, className }: PreviewPanelProps) {
  return (
    <div className={cn("h-full overflow-auto bg-background p-6", className)}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <PreviewContent content={content} />
      </Suspense>
    </div>
  );
} 