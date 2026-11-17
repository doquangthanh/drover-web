// Settings > Appearance > Terminal font: pick a font and size for every terminal pane on this device, with a live
// sample. The list holds the monospace fonts installed on the machine running Drover; any other name can be typed too.
import { useState, useSyncExternalStore, type KeyboardEvent } from "react";
import {
  chosenTerminalFont, onTerminalFontChange, ownTerminalFont, setTerminalFont, terminalFontFamily, terminalFontSize,
} from "../core/terminal-font";
import { useRpc } from "./use-rpc";

export function TerminalFontSettings() {
  useSyncExternalStore(onTerminalFontChange, chosenTerminalFont); // re-render the sample on every change
  const fonts = useRpc<string[]>("fonts.list").data ?? [];
  const own = ownTerminalFont();
  const [family, setFamily] = useState(own.family || "");
  const [size, setSize] = useState(own.size ? String(own.size) : "");
  const save = (f = family, s = size) => setTerminalFont(f.trim() || s ? { family: f, size: Number(s) || 0 } : null);
  const reset = () => { setFamily(""); setSize(""); setTerminalFont(null); };
  const onKey = (e: KeyboardEvent) => { if (e.key === "Enter") save(); };

  return (
    <>
      <div className="alab" style={{ marginTop: 22 }}>TERMINAL FONT</div>
      <div style={{ display: "flex", gap: 8, maxWidth: 520 }}>
        <input className="in mono" style={{ flex: 1 }} list="terminal-font-list" value={family}
          placeholder="Same as your system terminal" aria-label="Font"
          onChange={(e) => { setFamily(e.target.value); if (fonts.includes(e.target.value)) save(e.target.value); }}
          onBlur={() => save()} onKeyDown={onKey} />
        <datalist id="terminal-font-list">{fonts.map((f) => <option key={f} value={f} />)}</datalist>
        <input className="in mono" style={{ width: 80 }} type="number" min={8} max={40} value={size}
          placeholder={String(terminalFontSize())} aria-label="Size"
          onChange={(e) => { setSize(e.target.value); save(family, e.target.value); }} onKeyDown={onKey} />
        <button className="btn" onClick={reset} title="Back to your system terminal's font">Reset</button>
      </div>
      <div className="codebox" style={{ marginTop: 10, maxWidth: 520, fontFamily: terminalFontFamily(),
        fontSize: terminalFontSize(), lineHeight: 1.15, padding: "8px 10px" }}>
        {"$ claude  ❯ 1. Yes  0O 1lI {}[] => != ✓"}
      </div>
      <p className="meta" style={{ lineHeight: 1.6, marginTop: 8 }}>
        Pick a font from the list or type its name. Empty = the same font as your system terminal.
      </p>
    </>
  );
}
