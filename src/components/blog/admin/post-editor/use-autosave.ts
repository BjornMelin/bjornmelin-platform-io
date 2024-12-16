import { useState, useEffect, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { EditorState } from "@/types/blog";

interface AutosaveState {
  lastSaved?: Date;
  isAutosaving: boolean;
  clearAutosave: () => Promise<void>;
}

export function useAutosave(state: EditorState, postId: string): AutosaveState {
  const [lastSaved, setLastSaved] = useState<Date>();
  const [isAutosaving, setIsAutosaving] = useState(false);

  const saveToServer = useDebouncedCallback(
    async (state: EditorState) => {
      if (!state.isDirty) return;
      
      setIsAutosaving(true);
      try {
        const response = await fetch(`/api/posts/${postId}/autosave`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: state.content,
            title: state.title,
            excerpt: state.excerpt,
          }),
        });

        if (!response.ok) throw new Error("Failed to autosave");

        setLastSaved(new Date());
      } catch (error) {
        console.error("Autosave failed:", error);
      } finally {
        setIsAutosaving(false);
      }
    },
    2000,
    { maxWait: 10000 }
  );

  useEffect(() => {
    if (state.isDirty) {
      saveToServer(state);
    }
  }, [state, saveToServer]);

  const clearAutosave = useCallback(async () => {
    try {
      await fetch(`/api/posts/${postId}/autosave`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to clear autosave:", error);
    }
  }, [postId]);

  useEffect(() => {
    return () => {
      saveToServer.flush();
    };
  }, [saveToServer]);

  return {
    lastSaved,
    isAutosaving,
    clearAutosave,
  };
} 