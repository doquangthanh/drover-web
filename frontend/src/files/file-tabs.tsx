// Open files as tabs above the editor: click to switch, ✕ (or middle click) to close, ● marks unsaved edits.
import { useSyncExternalStore } from "react";
import type { Space } from "../core/protocol-types";
import { dirtySignature, isDirtyIn, subscribeDocs } from "./ace-editor-registry";
import { FileIcon } from "./file-icon";
import { docKey } from "./use-files-data";

interface Props {
  space: Space; tabs: string[]; active: string; status: Record<string, string>;
  onPick: (path: string) => void; onClose: (path: string) => void;
}

const base = (p: string) => p.slice(p.lastIndexOf("/") + 1);

export function FileTabs({ space, tabs, active, status, onPick, onClose }: Props) {
  const sig = useSyncExternalStore(subscribeDocs, dirtySignature);
  if (tabs.length < 2) return null; // one file: the header already says which
  return (
    <div className="ftabs" role="tablist">
      {tabs.map((p) => {
        const dirty = isDirtyIn(sig, docKey(space, p));
        const st = status[p];
        return (
          <div key={p} role="tab" aria-selected={p === active} className={"ftab" + (p === active ? " on" : "")} title={p}
            onClick={() => onPick(p)} onAuxClick={(e) => { if (e.button === 1) onClose(p); }}>
            <FileIcon name={base(p)} />
            <span className="trunc">{base(p)}</span>
            {st === "M" || st === "A" ? <span className="ftab-st">{st}</span> : null}
            {dirty ? <span className="fdirty" title="Unsaved changes">●</span> : null}
            <button className="ftab-x" aria-label={`Close ${base(p)}`} onClick={(e) => { e.stopPropagation(); onClose(p); }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}
