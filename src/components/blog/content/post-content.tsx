"use client";

import { useEffect, useState, useCallback } from "react";
import {
  processContent,
  type ProcessedContent,
} from "@/lib/utils/content-processor";

export function PostContent({ content }: { content: string }) {
  const [processedContent, setProcessedContent] = useState<ProcessedContent>();

  useEffect(() => {
    void processContent(content).then(setProcessedContent);
  }, [content]);

  const handleCopy = useCallback(async (e: MouseEvent) => {
    const button = e.currentTarget as HTMLButtonElement;
    const pre = button.parentElement?.querySelector("pre");
    if (!pre) return;

    await navigator.clipboard.writeText(pre.textContent || "");
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = "Copy";
    }, 2000);
  }, []);

  useEffect(() => {
    if (!processedContent) return;

    const buttons =
      document.querySelectorAll<HTMLButtonElement>(".copy-button");
    buttons.forEach((button) => {
      button.addEventListener("click", handleCopy);
    });

    return () => {
      buttons.forEach((button) => {
        button.removeEventListener("click", handleCopy);
      });
    };
  }, [processedContent, handleCopy]);

  if (!processedContent) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  return (
    <div
      className="prose prose-lg dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: processedContent.html }}
    />
  );
}
