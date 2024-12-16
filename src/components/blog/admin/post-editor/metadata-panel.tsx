"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { BlogPost, EditorField, EditorValue } from "@/types/blog";

interface MetadataPanelProps {
  post: BlogPost;
  onChange: (field: EditorField, value: EditorValue) => void;
}

const MAX_SEO_TITLE_LENGTH = 60;
const MAX_SEO_DESCRIPTION_LENGTH = 160;

export function MetadataPanel({ post, onChange }: MetadataPanelProps) {
  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim().toLowerCase();
      if (newTag && !post.tags.includes(newTag)) {
        onChange("tags", [...post.tags, newTag]);
      }
      e.currentTarget.value = "";
    }
  }, [post.tags, onChange]);

  const removeTag = useCallback((tagToRemove: string) => {
    onChange("tags", post.tags.filter(tag => tag !== tagToRemove));
  }, [post.tags, onChange]);

  return (
    <div className="h-full overflow-auto bg-muted/50 p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={post.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="Post title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={post.excerpt}
            onChange={(e) => onChange("excerpt", e.target.value)}
            placeholder="Brief description of the post"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Remove ${tag} tag`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input
            id="tags"
            placeholder="Add a tag (press Enter)"
            onKeyDown={handleTagKeyDown}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input
            id="seoTitle"
            value={post.seoTitle}
            onChange={(e) => onChange("seoTitle", e.target.value)}
            placeholder="SEO optimized title"
            maxLength={MAX_SEO_TITLE_LENGTH}
          />
          <p className="text-xs text-muted-foreground">
            {MAX_SEO_TITLE_LENGTH - (post.seoTitle?.length || 0)} characters remaining
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO Description</Label>
          <Textarea
            id="seoDescription"
            value={post.seoDescription}
            onChange={(e) => onChange("seoDescription", e.target.value)}
            placeholder="SEO optimized description"
            maxLength={MAX_SEO_DESCRIPTION_LENGTH}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {MAX_SEO_DESCRIPTION_LENGTH - (post.seoDescription?.length || 0)} characters remaining
          </p>
        </div>
      </div>
    </div>
  );
} 