"use client";

import { useRef, useState } from "react";
import { Terminal } from "xterm";
import { Fullscreen } from "lucide-react";
import { codes } from "./codes";
import { Monaco } from "./manco";
import { Xterm } from "./xterm";
import type { editor as MonacoEditorType } from "monaco-editor";
import { EditorKeys } from "./editor-keys";

export default function CodeRunner() {

  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<any>(null);

  // 🔥 ADD THIS
  const runIdRef = useRef(0);
const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);
  const [lang, setLang] = useState<keyof typeof codes>("python");
  const [code, setCode] = useState<string>(codes[lang]);
  const [running, setRunning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const terminalRef = useRef<any>(null);

  /* ---------- RUN ---------- */
  const runCode = () => {
    if (running) return;
    const term = terminalRef.current as Terminal;
    if (!term) {
      alert("Terminal not ready");
      return;
    }

    // 🔥 INCREMENT RUN ID
    runIdRef.current += 1;
    const myRunId = runIdRef.current;
    setRunning(true);
    setShowTerminal(true);

    term.clear();
    term.reset();
    term.write("▶ Running...\r\n");
    term.clear();
    term.reset();

    wsRef.current?.close();
    const wsUrl = location.protocol === "http:" ?
      `${process.env.NEXT_PUBLIC_WS_URL}${lang}`
      : `wss://api.compiler.studic.in/ws/${lang}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (runIdRef.current !== myRunId) return;
      ws.send(code);
      setTimeout(() => fitAddonRef.current?.fit(), 0);
    };

    ws.onmessage = e => {
      if (runIdRef.current !== myRunId) return;
      term.write(e.data);
    };

    ws.onclose = () => {
      if (runIdRef.current !== myRunId) return;

      term.write("\r\n✔ Finished");
      setTimeout(() => {
        term.clear();
        setShowTerminal(false)
        setRunning(false);
      }
        , 2000);
    };

    ws.onerror = () => {
      if (runIdRef.current !== myRunId) return;

      term.write("\r\n❌ Error");
      setRunning(false);
    };
  };

  /* ---------- LANGUAGE SWITCH ---------- */
  const switchLang = (l: keyof typeof codes) => {
    setLang(l);
    setCode(codes[l]);
  };

  return (
    <div className="h-screen bg-black text-white relative overflow-hidden" id="fscreen">
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-4
        bg-black/60 backdrop-blur-md z-20">
        <div className="font-semibold">⚡ Code Runner</div>
 
        
      
        <div className="flex gap-2">
          <Fullscreen  onClick={() => document.fullscreenElement ? document.exitFullscreen(): document.getElementById("fscreen")?.requestFullscreen()}/> 
          {!running && (
            <select
              value={lang}
              onChange={e => switchLang(e.target.value as any)}
              className="bg-neutral-800 text-xs px-2 py-1 rounded"
            >
              {...Object.keys(codes).map(langKey => <option value={langKey}>{langKey.toLocaleUpperCase()}</option>)}
            </select>
          )}

          <button
            onClick={runCode}
            disabled={running}
            className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs rounded cursor-pointer"
          >
            ▶ Run
          </button>
        </div>
      </div>

      {/* EDITOR */}
      <div className={`absolute inset-0 pt-12 ${showTerminal ? "opacity-0 pointer-events-none" : ""}`}>
        <Monaco lang={lang} code={code} setCode={setCode} editorRef={editorRef}/>
        <EditorKeys editor={editorRef.current}/>
      </div>
        <Xterm wsRef={wsRef} showTerminal={showTerminal} terminalRef={terminalRef} fitAddonRef={fitAddonRef}/>
      {/* TERMINAL */}

    </div>
  );
}
