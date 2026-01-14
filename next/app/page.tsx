"use client";

import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";

export default function WsTestPage() {
  const wsRef = useRef<WebSocket | null>(null);

  const [code, setCode] = useState(
`name = input("Enter name: ")
print("Hello", name)`
  );

  const [terminal, setTerminal] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [running, setRunning] = useState(false);

  const log = (text: string) => {
    setTerminal(prev => [...prev, text]);
  };

  // ▶ Execute code
  const execute = () => {
    setTerminal([]);
    setRunning(true);

const WS_URL =
  process.env.NODE_ENV === "development"
    ? "ws://127.0.0.1:4000/ws"
    : "wss://api.compiler.studic.in/ws";

const ws = new WebSocket(WS_URL);


    ws.onopen = () => {
      log("▶ Running...");
      ws.send(code);
    };

    ws.onmessage = (e) => {
      log(e.data);
    };

    ws.onclose = () => {
      log("❌ Program finished");
      setRunning(false);
      wsRef.current = null;
    };

    ws.onerror = () => {
      log("⚠️ WebSocket error");
      setRunning(false);
      wsRef.current = null;
    };

    wsRef.current = ws;
  };

  // terminal → stdin
  const handleTerminalInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && wsRef.current && running) {
      wsRef.current.send(terminalInput);
      log(`> ${terminalInput}`);
      setTerminalInput("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 20, marginBottom: 10 }}>
        Python Compiler
      </h2>

      {/* 🔥 CODE EDITOR */}
      <Editor
        height="200px"
        language="python"
        theme="vs-dark"
        value={code}
        onChange={(v) => setCode(v || "")}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
        }}
      />

      <button
        onClick={execute}
        disabled={running}
        style={{
          marginTop: 10,
          padding: "6px 14px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        ▶ Execute
      </button>

      {/* 🖥 TERMINAL */}
      <div
        style={{
          marginTop: 20,
          background: "#111",
          color: "#0f0",
          padding: 10,
          height: 300,
          overflowY: "auto",
          fontFamily: "monospace",
          fontSize: 14,
        }}
      >
        {terminal.map((line, i) => (
          <div key={i}>{line}</div>
        ))}

        {running && wsRef.current && (
          <div>
            <span>&gt; </span>
            <input
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyDown={handleTerminalInput}
              style={{
                background: "black",
                color: "#0f0",
                border: "none",
                outline: "none",
                width: "90%",
                fontFamily: "monospace",
              }}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}
