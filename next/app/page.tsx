"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "xterm/css/xterm.css";
import { Terminal } from "xterm";
import { Fullscreen, FullscreenIcon } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});
const codes = {
  node: `const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Name: ", name => {
  console.log("Hello", name);
  rl.close();
});
`,
  python: `name = input("Enter name: ")
print("Hello", name)
`,
  bash: 'ls -a'
}

export default function CodeRunner() {
  const termDivRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 🔥 ADD THIS
  const runIdRef = useRef(0);

  const [lang, setLang] = useState<keyof typeof codes>("python");
  const [code, setCode] = useState(codes["python"]);
  const [running, setRunning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  /* ---------- TERMINAL INIT (ONCE) ---------- */
  useEffect(() => {
    (async () => {
      const { Terminal } = await import("xterm");
      const { FitAddon } = await import("xterm-addon-fit");

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        theme: {
          background: "#000000",
          foreground: "#e5e7eb",
        }
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      if (!termDivRef.current) return;
      term.open(termDivRef.current);
      fitAddon.fit();

      terminalRef.current = term;
      fitAddonRef.current = fitAddon;

      term.onData((d: string) => {
        wsRef.current?.send(d);
      });
    })();
  }, []);

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
        <MonacoEditor
          height="100%"
          language={lang}
          theme="vs-dark"
          value={code}
          onChange={v => setCode(v || "")}
          options={{
            minimap: { enabled: false }, fontSize: 16,
            // 🔥 LINE NUMBER FIX
            lineNumbersMinChars: 3,     // default 5 hota hai
            glyphMargin: false,         // extra left margin hatao
            folding: false,             // folding arrow margin hatao
            lineDecorationsWidth: 8,    // default ~10–20 hota hai
            padding: { top: 4, bottom: 4 },
          }}
        />
      </div>

      {/* TERMINAL */}
      <div
        ref={termDivRef}
        className={`absolute inset-0 pt-12 bg-gray-700 transition-opacity [&_.xterm-screen]:px-1.5
    [&_.xterm-screen]:py-1.5
          ${showTerminal ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
    </div>
  );
}
