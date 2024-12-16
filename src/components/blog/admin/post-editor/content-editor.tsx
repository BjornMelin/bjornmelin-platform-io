"use client";

import {
  useCallback,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { EditorView } from "@codemirror/view";
import { useCodeMirror } from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { githubDark } from "@uiw/codemirror-theme-github";
import type { BlogPost } from "@/types/blog";

interface ContentEditorProps {
  content: BlogPost["content"];
  onChange: (content: BlogPost["content"]) => void;
  onImageInsert?: (url: string) => void;
}

export interface ContentEditorRef {
  handleImageInsert: (url: string) => void;
}

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
  },
  ".cm-scroller": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "14px",
    lineHeight: "1.6",
    padding: "1rem",
  },
  ".cm-content": {
    maxWidth: "65ch",
    margin: "0 auto",
  },
  ".cm-line": {
    padding: "0 4px",
  },
});

export const ContentEditor = forwardRef<ContentEditorRef, ContentEditorProps>(
  function ContentEditor({ content, onChange }, ref) {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorView = useRef<EditorView>();

    const handleImageInsert = useCallback((url: string) => {
      if (!editorView.current) return;

      const cursor = editorView.current.state.selection.main.head;
      const imageMarkdown = `![Image](${url})`;

      const transaction = editorView.current.state.update({
        changes: {
          from: cursor,
          to: cursor,
          insert: imageMarkdown,
        },
      });

      editorView.current.dispatch(transaction);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        handleImageInsert,
      }),
      [handleImageInsert]
    );

    const { setContainer } = useCodeMirror({
      container: editorRef.current,
      value: content,
      onChange: useCallback((value: string) => onChange(value), [onChange]),
      extensions: [
        markdown(),
        EditorView.lineWrapping,
        editorTheme,
        EditorView.updateListener.of((view) => {
          editorView.current = view.view;
        }),
      ],
      theme: githubDark,
      height: "100%",
      basicSetup: {
        lineNumbers: false,
        foldGutter: false,
        dropCursor: true,
        rectangularSelection: true,
        crosshairCursor: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        indentOnInput: true,
      },
    });

    useEffect(() => {
      if (editorRef.current) {
        setContainer(editorRef.current);
      }
    }, [setContainer]);

    return (
      <div
        ref={editorRef}
        className="h-full overflow-hidden prose prose-sm dark:prose-invert"
      />
    );
  }
);
