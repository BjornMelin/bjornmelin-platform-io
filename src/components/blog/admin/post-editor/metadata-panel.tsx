"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { BlogPost } from "@/types/blog";

const MAX_SEO_TITLE_LENGTH = 60;
const MAX_SEO_DESCRIPTION_LENGTH = 160;

export interface MetadataPanelProps {
  title: BlogPost["title"];
  seoTitle: BlogPost["seoTitle"];
  seoDescription: BlogPost["seoDescription"];
  excerpt: BlogPost["excerpt"];
  tags: BlogPost["tags"];
  onTitleChange: (value: BlogPost["title"]) => void;
  onSeoTitleChange: (value: BlogPost["seoTitle"]) => void;
  onSeoDescriptionChange: (value: BlogPost["seoDescription"]) => void;
  onExcerptChange: (value: BlogPost["excerpt"]) => void;
  onTagsChange: (value: BlogPost["tags"]) => void;
}

export function MetadataPanel({
  title,
  seoTitle,
  seoDescription,
  excerpt,
  tags,
  onTitleChange,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onExcerptChange,
  onTagsChange,
}: MetadataPanelProps) {
  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && e.currentTarget.value) {
        e.preventDefault();
        const newTag = e.currentTarget.value.trim().toLowerCase();
        if (newTag && !tags.includes(newTag)) {
          onTagsChange([...tags, newTag]);
        }
        e.currentTarget.value = "";
      }
    },
    [tags, onTagsChange]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onTagsChange(tags.filter((tag) => tag !== tagToRemove));
    },
    [tags, onTagsChange]
  );

  return (
    <div className="h-full overflow-auto bg-muted/50 p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Post title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={excerpt || ""}
            onChange={(e) => onExcerptChange(e.target.value)}
            placeholder="Brief description of the post"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
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
            value={seoTitle || ""}
            onChange={(e) => onSeoTitleChange(e.target.value)}
            placeholder="SEO optimized title"
            maxLength={MAX_SEO_TITLE_LENGTH}
          />
          <p className="text-xs text-muted-foreground">
            {MAX_SEO_TITLE_LENGTH - (seoTitle?.length || 0)} characters
            remaining
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO Description</Label>
          <Textarea
            id="seoDescription"
            value={seoDescription || ""}
            onChange={(e) => onSeoDescriptionChange(e.target.value)}
            placeholder="SEO optimized description"
            maxLength={MAX_SEO_DESCRIPTION_LENGTH}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            {MAX_SEO_DESCRIPTION_LENGTH - (seoDescription?.length || 0)}{" "}
            characters remaining
          </p>
        </div>
      </div>
    </div>
  );
}
