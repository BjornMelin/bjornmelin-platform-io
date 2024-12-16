"use client";

import { useCallback, useRef, useEffect } from "react";
import { useCodeMirror } from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { githubDark } from "@uiw/codemirror-theme-github";

interface ContentEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
  },
  ".cm-scroller": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
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

export function ContentEditor({ content, onChange }: ContentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const { setContainer } = useCodeMirror({
    value: content,
    onChange: useCallback((value: string) => onChange(value), [onChange]),
    extensions: [
      markdown(),
      EditorView.lineWrapping,
      editorTheme,
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
    <div className="h-full overflow-hidden" ref={editorRef} />
  );
} 