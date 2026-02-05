"use client";
import "@/app/monaco.module.css";
import dynamic from "next/dynamic";
import { Dispatch, SetStateAction, useRef } from "react";
import type { editor as MonacoEditorType } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export function Monaco({
  lang,
  code,
  setCode,
  editorRef,
}: {
  lang: string;
  code: string;
  setCode: Dispatch<SetStateAction<string>>;
  editorRef: React.MutableRefObject<MonacoEditorType.IStandaloneCodeEditor | null>;
}) {
  return (
    <MonacoEditor
      height="100%"
      language={lang}
      theme="vs-dark"
      value={code}
      onMount={(editor) => {
        editorRef.current = editor; // ✅ safe ref
      }}
      onChange={(v) => setCode(v || "")}
      options={{
        minimap: { enabled: false },
        fontSize: 15,
        lineNumbersMinChars: 3,
        glyphMargin: false,
        folding: false,
        lineDecorationsWidth: 8,
        padding: { top: 4, bottom: 4 },

        // 🔥 MOBILE SELECTION FIX
        selectOnLineNumbers: true,
        wordWrap: "on",

        // 👇 THESE ARE KEY
        mouseWheelZoom: true,
        cursorSmoothCaretAnimation: "on",

        // allow touch selection
        quickSuggestions: false,
        contextmenu: true,
      }}
    />
  );
}
