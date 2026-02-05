"use client"
import React, { useEffect, useRef } from "react";
import "xterm/css/xterm.css";
import { ExtraKeys } from "./extra-keys";

interface XtermProps {
  wsRef: React.RefObject<WebSocket | null>;
  showTerminal: boolean;
  terminalRef: React.RefObject<any>;
  fitAddonRef: React.RefObject<any>;
}

export const Xterm: React.FC<XtermProps> = ({wsRef, showTerminal, terminalRef, fitAddonRef}) => {
      const termDivRef = useRef<HTMLDivElement>(null);
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
const isTouch =
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

    return (

        <div className={`absolute inset-0 pt-12 ${showTerminal ? "" : "hidden"}`}>
      
      {/* 🔥 EXTRA KEYS BAR */}
      <div className="absolute bottom-40 left-0 right-0 z-10">
        <ExtraKeys ws={wsRef.current}/>
      </div>

      {/* TERMINAL */}
      <div
        ref={termDivRef}
        className={`absolute inset-0 pt-12 bg-black [&_.xterm-screen]:px-1.5 [&_.xterm-screen]:py-1.5`}
      />
    </div>
    )
}