// Shared Up/Down/Enter selection for the palette, terminal search and any list opened from a text input.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

/** Next selected index for a key press (clamped, no wrap); null when the key is not a navigation key. */
export function moveSelection(selected: number, key: string, count: number): number | null {
  if (key === "ArrowDown") return Math.min(selected + 1, Math.max(0, count - 1));
  if (key === "ArrowUp") return Math.max(selected - 1, 0);
  return null;
}

export function clampSelection(selected: number, count: number): number {
  return Math.min(selected, Math.max(0, count - 1));
}

/** `resetKey` changing (the query) puts the selection back on the first row. */
export function useListKeyboardNav(count: number, onEnter: (index: number) => void, resetKey: unknown = null) {
  const [raw, setSelected] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = clampSelection(raw, count);

  useEffect(() => { setSelected(0); }, [resetKey]);
  useEffect(() => { listRef.current?.querySelector(".it.on")?.scrollIntoView?.({ block: "nearest" }); }, [selected, count]);

  const onKeyDown = (e: KeyboardEvent) => {
    const next = moveSelection(selected, e.key, count);
    if (next !== null) { setSelected(next); e.preventDefault(); }
    else if (e.key === "Enter" && count > 0) onEnter(selected);
  };
  return { selected, setSelected, onKeyDown, listRef };
}
