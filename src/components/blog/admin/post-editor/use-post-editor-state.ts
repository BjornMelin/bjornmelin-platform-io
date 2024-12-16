import { useReducer } from "react";
import type { BlogPost, EditorState, EditorField, EditorValue } from "@/types/blog";

type EditorAction =
  | { type: "SET_CONTENT"; content: string }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_EXCERPT"; excerpt: string }
  | { type: "SET_TAGS"; tags: string[] }
  | { type: "SET_FIELD"; field: EditorField; value: EditorValue }
  | { type: "SET_PUBLISHED"; published: boolean }
  | { type: "SAVED"; post: BlogPost }
  | { type: "VALIDATE" }
  | { type: "RESET"; post: BlogPost };

function validatePost(state: EditorState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!state.title?.trim()) {
    errors.title = "Title is required";
  }

  if (!state.content?.trim()) {
    errors.content = "Content is required";
  }

  if (!state.excerpt?.trim()) {
    errors.excerpt = "Excerpt is required";
  }

  return errors;
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_CONTENT":
    case "SET_TITLE":
    case "SET_EXCERPT":
    case "SET_TAGS":
      return {
        ...state,
        [action.type.toLowerCase().split("_")[1]]: action[
          action.type.toLowerCase().split("_")[1] as keyof typeof action
        ],
        isDirty: true,
      };
    
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
        isDirty: true,
      };
    
    case "SET_PUBLISHED":
      return {
        ...state,
        published: action.published,
        isDirty: true,
      };
    
    case "SAVED":
      return {
        ...state,
        ...action.post,
        isDirty: false,
        validationErrors: {},
      };
    
    case "VALIDATE":
      return {
        ...state,
        validationErrors: validatePost(state),
      };
    
    case "RESET":
      return {
        ...action.post,
        isDirty: false,
        validationErrors: {},
      };
    
    default:
      return state;
  }
}

export function usePostEditorState(initialPost: BlogPost) {
  return useReducer(editorReducer, {
    ...initialPost,
    isDirty: false,
    validationErrors: {},
  });
} 