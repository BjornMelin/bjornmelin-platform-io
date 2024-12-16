"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/blog/admin/shared/status-badge";
import { SaveIcon, Globe, ArrowLeft } from "lucide-react";
import type { BlogPost } from "@/types/blog";

interface EditorToolbarProps {
  post: BlogPost;
  isSaving: boolean;
  lastSaved?: Date;
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
}

export function EditorToolbar({
  post,
  isSaving,
  lastSaved,
  onSave,
  onPublish,
}: EditorToolbarProps) {
  const formattedTime = lastSaved?.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "numeric",
  });

  return (
    <div className="border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to posts</span>
          </Link>
          
          <div>
            <h1 className="text-lg font-medium leading-none">
              {post.title || "Untitled Post"}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge published={post.published} />
              {formattedTime && (
                <span>Last saved: {formattedTime}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isSaving}
            onClick={onSave}
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>

          {!post.published && (
            <Button
              size="sm"
              disabled={isSaving}
              onClick={onPublish}
            >
              <Globe className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 