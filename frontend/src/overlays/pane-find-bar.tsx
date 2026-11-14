// Find-in-scrollback bar shown under a pane header (Ctrl+B [). Phase 8 mounts it and supplies the terminal-registry hooks.
import { useEffect, useRef, useState } from "react";
import { Icon } from "../ui/atoms/icon";

export interface FindResult { index: number; total: number }

export interface PaneFindBarProps {
  /** Search the pane: `step` jumps to the next match in `dir` (-1 older, 1 newer) instead of restarting from the query. */
  find: (query: string, step?: boolean, dir?: number) => FindResult;
  /** "scrollback 1,234 / 5,000"-style depth text. */
  depth: () => string;
  onClose: () => void;
  initialQuery?: string;
}

export function findStatus(r: FindResult, query: string): string {
  return r.total ? `${r.index} of ${r.total}` : query ? "no match" : "";
}

export function PaneFindBar({ find, depth, onClose, initialQuery = "" }: PaneFindBarProps) {
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState("");
  const [lines, setLines] = useState(depth);

  useEffect(() => { input.current?.focus(); if (initialQuery) setStatus(findStatus(find(initialQuery), initialQuery)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const step = (dir: number) => setStatus(findStatus(find(query, true, dir), query));
  return (
    <div className="findbar">
      <label className="flab" htmlFor="find-q"><Icon name="search" cls="i sm" />Find</label>
      <input ref={input} id="find-q" aria-label="Find in scrollback" autoComplete="off" value={query}
        onChange={(e) => { setQuery(e.target.value); setStatus(findStatus(find(e.target.value), e.target.value)); setLines(depth()); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Enter") step(e.shiftKey ? 1 : -1);
        }} />
      <span className="fcount">{status}</span>
      <button className="pb" aria-label="Older match" onClick={() => step(-1)}>↑</button>
      <button className="pb" aria-label="Newer match" onClick={() => step(1)}>↓</button>
      <span className="grow" />
      <span className="meta"><span className="meta">{lines}</span> · <span className="k">Enter</span> older <span className="k">⇧ Enter</span> newer <span className="k">Esc</span> exit</span>
    </div>
  );
}
