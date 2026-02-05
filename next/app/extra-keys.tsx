"use client";

import { useEffect, useState } from "react";
import { KeyBtn } from "./key-btn";

export function useKeyboardOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const h = window.innerHeight - vv.height;
      setOffset(h > 0 ? h : 0);
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return offset;
}

export function ExtraKeys({ ws }: { ws: WebSocket | null }) {
  const keyboardOffset = useKeyboardOffset();

  if (!ws || ws.readyState !== WebSocket.OPEN) return null;

  const send = (data: string) => {
    ws.send(data); // ✅ ONLY send to backend
  };

  return (
    <div
      style={{ bottom: keyboardOffset }}
      className="
        fixed left-0 right-0 z-50
        bg-black/90 backdrop-blur
        border-t border-neutral-700
        flex gap-2 px-2 py-2
        overflow-x-auto
      "
    >
      <KeyBtn label="Ctrl+C" send={() => send("\x03")} />
      <KeyBtn label="Ctrl+D" send={() => send("\x04")} />
      <KeyBtn label="Ctrl+Z" send={() => send("\x1A")} />
      <KeyBtn label="Esc"    send={() => send("\x1B")} />
      <KeyBtn label="Tab"    send={() => send("\t")} />

      <KeyBtn label="←" send={() => send("\x1b[D")} />
      <KeyBtn label="↑" send={() => send("\x1b[A")} />
      <KeyBtn label="↓" send={() => send("\x1b[B")} />
      <KeyBtn label="→" send={() => send("\x1b[C")} />

      <KeyBtn label="Enter" send={() => send("\r")} />
    </div>
  );
}
