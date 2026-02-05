import { useKeyboardOffset } from "./extra-keys";
import { EditorKeyBtn } from "./editor-button";
import type { editor as MonacoEditorType } from "monaco-editor";

export function EditorKeys({ editor }: { editor: MonacoEditorType.IStandaloneCodeEditor | null }) {
  const keyboardOffset = useKeyboardOffset();
  if (!editor) return null;

  const selectAll = () => {
    editor.focus();
    editor.setSelection(editor.getModel()!.getFullModelRange());
  };

function fallbackCopy(text: string) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

 async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
  await navigator.clipboard.writeText(text);
  } else {
    fallbackCopy(text); // 🔥 fallback
  }
}

const copy = async () => {
  const sel = editor.getSelection();
  if (!sel || sel.isEmpty()) return;

  const text = editor.getModel()!.getValueInRange(sel);
  await copyText(text);
};

async function pasteText() {
  if (navigator.clipboard?.readText) {
    return await navigator.clipboard.readText();
  }
  return ""; // fallback paste not allowed by browser
}
const canPaste = !!navigator.clipboard?.readText;


const paste = async () => {
  const text = await pasteText();
  if (!text) return;

  editor.executeEdits("paste", [
    {
      range: editor.getSelection()!,
      text,
      forceMoveMarkers: true,
    },
  ]);
};

  return (
    <div
      style={{ bottom: keyboardOffset }}
      className="fixed left-0 right-0 z-50 bg-neutral-900 flex gap-2 px-2 py-2"
    >
      <EditorKeyBtn label="Select All" onPress={selectAll} />
      <EditorKeyBtn label="Copy" onPress={copy} />
      {canPaste && <EditorKeyBtn label="Paste" onPress={paste} />}
      <EditorKeyBtn label="Undo" onPress={() => editor.trigger("ui", "undo", null)} />
      <EditorKeyBtn label="Redo" onPress={() => editor.trigger("ui", "redo", null)} />
    </div>
  );
}
