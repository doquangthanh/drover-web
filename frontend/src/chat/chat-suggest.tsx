// The suggestion list above the message box (files after `@`, commands after `/`). Keyboard handling lives in the composer.
import { useEffect, useRef } from "react";

export interface Suggestion { key: string; label: string; detail?: string }

export function ChatSuggest({ title, items, index, onPick, empty }: {
  title: string; items: Suggestion[]; index: number; onPick: (i: number) => void; empty?: string;
}) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => { list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" }); }, [index, items]);
  return (
    <div className="suggest" role="listbox" aria-label={title} ref={list}>
      <div className="suggest-title">{title}</div>
      {items.length ? items.map((it, i) => (
        <button key={it.key} id={`sg-${i}`} role="option" aria-selected={i === index} className={"suggest-row" + (i === index ? " on" : "")}
          onMouseDown={(e) => { e.preventDefault(); onPick(i); }}> {/* mousedown, so the text box keeps its focus */}
          <span className="suggest-label trunc">{it.label}</span>
          {it.detail ? <span className="suggest-detail trunc">{it.detail}</span> : null}
        </button>
      )) : <div className="suggest-empty">{empty || "No matches"}</div>}
    </div>
  );
}
