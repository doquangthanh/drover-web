// "Jump to a terminal" (Ctrl+A /): agents, spaces and scrollback matches across all machines, with a live preview.
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { getActions } from "../core/keys";
import { conn } from "../core/connection";
import type { Pane } from "../core/protocol-types";
import { useStore } from "../core/store";
import { Icon } from "../ui/atoms/icon";
import { KindIcon } from "../ui/atoms/kind-icon";
import { SpaceAvatar } from "../ui/atoms/space-avatar";
import { StateMark } from "../ui/atoms/state-mark";
import { closeModal, openModal } from "./modal-store";
import { MAX_TEXT, matchAgents, matchSpaces, splitHighlight, type TextHit } from "./search-logic";
import { useListKeyboardNav } from "./use-list-keyboard-nav";

function Highlight({ text, q }: { text: string; q: string }) {
  const parts = splitHighlight(text, q);
  return parts ? <>{parts[0]}<mark>{parts[1]}</mark>{parts[2]}</> : <>{text}</>;
}

interface Item { key: string; section: string; go: () => void; pane: string | null; row: ReactNode }

function Preview({ paneId }: { paneId: string | null }) {
  const pane = useStore((s) => (paneId ? s.paneById.get(paneId) : undefined));
  const [text, setText] = useState("");
  useEffect(() => {
    setText("");
    if (!paneId) return;
    let live = true;
    conn.rpc("pane.read", { pane: paneId, lines: 24 }).then((r) => { if (live) setText(String(r.text || "").replace(/\s+$/, "")); }).catch(() => {});
    return () => { live = false; };
  }, [paneId]);
  return (
    <div className="sp-r">
      <div className="ph">
        {pane ? <><KindIcon kind={pane.kind} /><b style={{ fontWeight: 500 }}>{pane.name}</b>
          <span className="grow trunc meta">{pane.cwd} · live preview</span><StateMark pane={pane} /></> : null}
      </div>
      <div className="pv">{pane ? text : ""}</div>
    </div>
  );
}

function agentRow(p: Pane, q: string, parentName: string | undefined, spaceName: string): ReactNode {
  return <>
    <KindIcon kind={p.kind} />
    <span className="lb"><Highlight text={p.name || ""} q={q} /></span>
    <span className="meta">{parentName ? `child of ${parentName}` : spaceName}</span>
    <StateMark pane={p} />
  </>;
}

function Search() {
  const panes = useStore((s) => s.panes);
  const spaces = useStore((s) => s.spaces);
  const paneById = useStore((s) => s.paneById);
  const spaceById = useStore((s) => s.spaceById);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<TextHit[]>([]);
  const q = query.trim();

  useEffect(() => {
    setHits([]);
    if (q.length < 2) return;
    let live = true;
    const timer = setTimeout(() => {
      conn.rpc("search.query", { q }).then((r) => { if (live) setHits(r.text || []); }).catch(() => {});
    }, 200);
    return () => { live = false; clearTimeout(timer); };
  }, [q]);

  const items = useMemo<Item[]>(() => {
    const actions = getActions();
    const out: Item[] = matchAgents(panes, q).map((p) => {
      const parentId = (p as { parent?: string }).parent;
      const parent = parentId ? paneById.get(parentId) : undefined;
      return { key: `a:${p.id}`, section: "Agents", pane: p.id, go: () => actions.focusPane?.(p.id),
        row: agentRow(p, q, parent?.name, (p.space_id && spaceById.get(p.space_id)?.name) || "") };
    });
    for (const s of matchSpaces(spaces, q)) {
      out.push({ key: `s:${s.id}`, section: "Workspaces & worktrees", pane: null, go: () => actions.selectSpace?.(s.id),
        row: <><SpaceAvatar space={s} /><span className="lb"><Highlight text={s.name || ""} q={q} /></span>
          <span className="meta mono trunc">{s.branch || s.cwd}</span></> });
    }
    hits.slice(0, MAX_TEXT).forEach((t, i) => out.push({
      key: `t:${i}`, section: `In scrollback · ${hits.length} match${hits.length > 1 ? "es" : ""}`, pane: t.pane,
      go: () => { actions.focusPane?.(t.pane); actions.find?.({ paneId: t.pane, query: q }); },
      row: <><span className="meta mono" style={{ width: "56px" }}>{t.name}</span><span className="lb mono"><Highlight text={t.text} q={q} /></span></>,
    }));
    return out;
  }, [panes, spaces, paneById, spaceById, hits, q]);

  const go = (i: number) => { const it = items[i]; closeModal(); it.go(); };
  const nav = useListKeyboardNav(items.length, go, q);
  const more = hits.length - MAX_TEXT;

  let section = "";
  return (
    <>
      <div className="mhead">
        <Icon name="search" />
        <input className="qin" placeholder="Jump to a terminal…" aria-label="Jump to a terminal" autoFocus value={query}
          onChange={(e) => setQuery(e.target.value)} onKeyDown={nav.onKeyDown} />
        <span className="meta">agents · workspaces · scrollback</span>
        <span className="k">Esc</span>
      </div>
      <div className="sp">
        <div className="sp-l" ref={nav.listRef}>
          {items.map((it, i) => {
            const header = it.section !== section ? <div className="sec">{(section = it.section)}</div> : null;
            return <Fragment key={it.key}>{header}
              <button className={`it${i === nav.selected ? " on" : ""}`} onClick={() => go(i)}>{it.row}</button></Fragment>;
          })}
          {more > 0 ? <div className="it meta" style={{ paddingLeft: "76px" }}>{more} more…</div> : null}
          {!items.length ? <div className="sec">{q ? "Nothing found" : "No agents yet"}</div> : null}
        </div>
        <Preview paneId={items[nav.selected]?.pane ?? null} />
      </div>
      <div className="hint"><span>↑↓ move</span><span>↵ jump</span><span className="grow" />local scrollback search</div>
    </>
  );
}

export function openSearch(): void {
  openModal({ label: "Jump to a terminal", size: "srch", body: <Search /> });
}
