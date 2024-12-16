"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { trpc } from "@/lib/trpc/client";
import { type BlogPost } from "@/types/blog";
import { Toolbar } from "./toolbar";
import { ContentEditor, type ContentEditorRef } from "./content-editor";
import { PreviewPanel } from "./preview-panel";
import { MetadataPanel } from "./metadata-panel";
import { useToast } from "@/hooks/use-toast";

interface PostEditorProps {
  post: BlogPost;
}

export function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState<BlogPost["content"]>(post.content);
  const [title, setTitle] = useState<BlogPost["title"]>(post.title);
  const [seoTitle, setSeoTitle] = useState<BlogPost["seoTitle"]>(post.seoTitle);
  const [seoDescription, setSeoDescription] = useState<
    BlogPost["seoDescription"]
  >(post.seoDescription);
  const [excerpt, setExcerpt] = useState<BlogPost["excerpt"]>(post.excerpt);
  const [tags, setTags] = useState<BlogPost["tags"]>(post.tags);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>();
  const editorRef = useRef<ContentEditorRef>(null);
  const { toast } = useToast();

  const updatePostMutation = trpc.blog.update.useMutation<BlogPost>({
    onSuccess: () => {
      setLastSaved(new Date());
      toast({
        title: "Success",
        description: "Post saved successfully",
      });
      router.refresh();
    },
    onError: (error) => {
      console.error("Failed to save post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save post",
        variant: "destructive",
      });
    },
  });

  const publishPostMutation = trpc.blog.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post published successfully",
      });
      router.refresh();
    },
    onError: (error) => {
      console.error("Failed to publish post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to publish post",
        variant: "destructive",
      });
    },
  });

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await updatePostMutation.mutateAsync({
        id: post.id,
        title,
        seoTitle,
        seoDescription,
        excerpt,
        content,
        tags,
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    post.id,
    title,
    seoTitle,
    seoDescription,
    excerpt,
    content,
    tags,
    isSaving,
    updatePostMutation,
  ]);

  const handlePublish = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await publishPostMutation.mutateAsync({
        id: post.id,
        published: true,
      });
    } finally {
      setIsSaving(false);
    }
  }, [post.id, isSaving, publishPostMutation]);

  const handleImageInsert = useCallback((url: string) => {
    editorRef.current?.handleImageInsert(url);
  }, []);

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const hasChanges =
      content !== post.content ||
      title !== post.title ||
      seoTitle !== post.seoTitle ||
      seoDescription !== post.seoDescription ||
      excerpt !== post.excerpt ||
      JSON.stringify(tags) !== JSON.stringify(post.tags);

    if (hasChanges && !isSaving) {
      timer = setTimeout(() => {
        handleSave();
      }, 30000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    content,
    title,
    seoTitle,
    seoDescription,
    excerpt,
    tags,
    post,
    isSaving,
    handleSave,
  ]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!isSaving) {
          handleSave();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, handleSave]);

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        onImageInsert={handleImageInsert}
        onSave={handleSave}
        onPublish={handlePublish}
        isSaving={isSaving}
        lastSaved={lastSaved}
        isPublished={post.published}
      />
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={40} minSize={30}>
          <ContentEditor
            ref={editorRef}
            content={content}
            onChange={setContent}
          />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={40} minSize={30}>
          <PreviewPanel content={content} />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={20} minSize={15}>
          <MetadataPanel
            title={title}
            seoTitle={seoTitle}
            seoDescription={seoDescription}
            excerpt={excerpt}
            tags={tags}
            onTitleChange={setTitle}
            onSeoTitleChange={setSeoTitle}
            onSeoDescriptionChange={setSeoDescription}
            onExcerptChange={setExcerpt}
            onTagsChange={setTags}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
