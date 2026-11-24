// "Check errors": file:line references from the last failed checks of the current space; Enter opens the file there.
import { useEffect, useState } from "react";
import { conn } from "../core/connection";
import type { CheckRun, Space } from "../core/protocol-types";
import { useStore } from "../core/store";
import { machineAlias } from "../core/store-derive";
import { toast } from "../core/toast-store";
import { openFileAt } from "../files/open-from-terminal";
import { quickfixItems, type QuickfixItem } from "../files/quickfix-logic";
import { closeModal, openModal } from "./modal-store";
import { useListKeyboardNav } from "./use-list-keyboard-nav";

function Quickfix({ space }: { space: Space }) {
  const [items, setItems] = useState<QuickfixItem[] | null>(null);
  useEffect(() => {
    const machine = machineAlias(space);
    conn.rpc<CheckRun>("check.list", { cwd: space.cwd, ...(machine ? { machine } : {}) })
      .then((run) => setItems(quickfixItems(run.results ?? [], space.cwd ?? "")), () => setItems([]));
  }, [space]);
  const list = items ?? [];
  const go = (i: number) => { const it = list[i]; if (!it) return; closeModal(); openFileAt(space, it.path, it.line, it.col); };
  const nav = useListKeyboardNav(list.length, go, "");
  return (
    <>
      <div className="mhead"><h2>Check errors</h2><span className="meta">{space.name}</span></div>
      <div className="list" ref={nav.listRef} tabIndex={0} onKeyDown={nav.onKeyDown}>
        {items === null ? <div className="meta" style={{ padding: 14 }}>Loading…</div> : null}
        {items && !items.length ? <div className="meta" style={{ padding: 14 }}>No file:line references in failed checks. Run the checks in Changes first.</div> : null}
        {list.map((it, i) => (
          <button key={i} className={`it${i === nav.selected ? " on" : ""}`} onClick={() => go(i)}>
            <span className="lb"><span className="mono">{it.path}{it.line ? `:${it.line}` : ""}</span><span className="pgroup">{it.step}</span></span>
            <span className="meta trunc" style={{ maxWidth: 260 }}>{it.text}</span>
          </button>
        ))}
      </div>
      <div className="hint"><span>↑↓ move</span><span>↵ open</span><span className="grow" /><span>{list.length} found</span></div>
    </>
  );
}

export function openQuickfix(): void {
  const s = useStore.getState();
  const space = s.ui.spaceId ? s.spaceById.get(s.ui.spaceId) : undefined;
  if (!space?.cwd) { toast("Open a space first"); return; }
  openModal({ label: "Check errors", size: "pal", body: <Quickfix space={space} /> });
}
