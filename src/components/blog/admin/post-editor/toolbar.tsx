"use client";

import { ImagePlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaPicker } from "../media/media-picker";
import { useToast } from "@/hooks/use-toast";
import type { BlogPost } from "@/types/blog";

interface ToolbarProps {
  onImageInsert: (url: string) => void;
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
  isSaving: boolean;
  lastSaved?: Date;
  isPublished?: BlogPost["published"];
}

export function Toolbar({
  onImageInsert,
  onSave,
  onPublish,
  isSaving,
  lastSaved,
  isPublished,
}: ToolbarProps) {
  const { toast } = useToast();

  const handlePublish = async () => {
    await onPublish();
    toast({
      title: isPublished ? "Post Updated" : "Post Published",
      description: isPublished
        ? "Your post has been updated."
        : "Your post has been published.",
    });
  };

  return (
    <div className="border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MediaPicker
            onSelect={onImageInsert}
            trigger={
              <Button variant="ghost" size="sm">
                <ImagePlus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            }
          />
        </div>

        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-sm text-muted-foreground">
              Last saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={handlePublish} disabled={isSaving}>
            {isPublished ? "Update" : "Publish"}
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
