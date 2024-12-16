"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ContentEditor } from "./content-editor";
import { PreviewPanel } from "./preview-panel";
import { MetadataPanel } from "./metadata-panel"; 
import { EditorToolbar } from "./editor-toolbar";
import { usePostEditorState } from "./use-post-editor-state";
import { useAutosave } from "./use-autosave";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  updatedAt: string;
}

interface PostEditorProps {
  post: BlogPost;
}

export function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const { state, dispatch } = usePostEditorState(post);
  const { lastSaved } = useAutosave(state, post.id);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(state),
      });

      if (!response.ok) throw new Error("Failed to save post");

      const updatedPost = await response.json();
      dispatch({ type: "SAVED", post: updatedPost });
      toast.success("Changes saved successfully");
      router.refresh();
    } catch (error) {
      console.error("Failed to save post:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }, [state, post.id, router, dispatch]);

  const handlePublish = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/publish`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to publish post");

      const updatedPost = await response.json();
      dispatch({ type: "SAVED", post: updatedPost });
      toast.success("Post published successfully");
      router.refresh();
    } catch (error) {
      console.error("Failed to publish post:", error);
      toast.error("Failed to publish post");
    } finally {
      setIsSaving(false);
    }
  }, [post.id, router, dispatch]);

  return (
    <div className="h-full flex flex-col">
      <EditorToolbar
        post={state}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={handleSave}
        onPublish={handlePublish}
      />
      
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1"
      >
        <ResizablePanel defaultSize={40}>
          <ContentEditor
            content={state.content}
            onChange={(content) => dispatch({ type: "SET_CONTENT", content })}
          />
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={40}>
          <PreviewPanel content={state.content} />
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={20}>
          <MetadataPanel
            post={state}
            onChange={(field, value) => dispatch({ type: "SET_FIELD", field, value })}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
} 