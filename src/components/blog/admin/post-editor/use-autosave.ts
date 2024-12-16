import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import type { EditorState } from "@/types/blog";

interface AutosaveState {
  lastSaved?: Date;
  isAutosaving: boolean;
  clearAutosave: () => Promise<void>;
}

interface AutosaveData {
  content: string;
  title: string;
  excerpt: string;
}

export function useAutosave(state: EditorState, postId: string): AutosaveState {
  const [lastSaved, setLastSaved] = useState<Date>();
  const [isAutosaving, setIsAutosaving] = useState(false);

  const saveToServer = useDebounce(async (data: AutosaveData) => {
    if (!state.isDirty) return;

    setIsAutosaving(true);
    try {
      const response = await fetch(`/api/posts/${postId}/autosave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to autosave: ${response.statusText}`);
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error(
        "Autosave failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsAutosaving(false);
    }
  }, 2000);

  useEffect(() => {
    if (state.isDirty) {
      const autosaveData: AutosaveData = {
        content: state.content,
        title: state.title,
        excerpt: state.excerpt,
      };
      saveToServer(autosaveData);
    }
  }, [state, saveToServer]);

  const clearAutosave = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/autosave`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to clear autosave: ${response.statusText}`);
      }
    } catch (error) {
      console.error(
        "Failed to clear autosave:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }, [postId]);

  return {
    lastSaved,
    isAutosaving,
    clearAutosave,
  };
}
