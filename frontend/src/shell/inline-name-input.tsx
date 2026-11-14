// The name field that replaces a label while renaming in place: Enter or clicking away saves, Escape cancels.
import { useEffect, useRef } from "react";
import { stopRename } from "../core/inline-rename-store";

export function InlineNameInput({ value, onCommit, className = "" }: { value: string; onCommit: (name: string) => void; className?: string }) {
  const field = useRef<HTMLInputElement>(null);
  const finished = useRef(false);
  useEffect(() => { field.current?.focus(); field.current?.select(); }, []);

  const finish = (save: boolean) => {
    if (finished.current) return;
    finished.current = true;
    const name = field.current?.value.trim();
    stopRename();
    if (save && name && name !== value) onCommit(name);
  };
  const keep = (e: { stopPropagation(): void }) => e.stopPropagation(); // clicks and keys belong to the field, not the row behind it

  return (
    <input ref={field} className={"inline-name " + className} defaultValue={value} aria-label="Name" spellCheck={false}
      onClick={keep} onDoubleClick={keep} onMouseDown={keep} onContextMenu={keep}
      onKeyDown={(e) => {
        keep(e);
        if (e.key === "Enter") { e.preventDefault(); finish(true); }
        else if (e.key === "Escape") { e.preventDefault(); finish(false); }
      }}
      onBlur={() => finish(true)} />
  );
}
