// Folder chooser: native dialog in the desktop window for this computer; in-app browser otherwise.
// The in-app picker is its own root in #overlay-root so it can sit above the New agent modal without replacing it.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { conn } from "../core/connection";
import type { Machine } from "../core/protocol-types";
import { useStore } from "../core/store";
import { errorToast } from "../core/toast-store";
import { Icon } from "../ui/atoms/icon";
import { hasNativePicker, pickNativeFolder } from "./folder-picker-desktop-bridge";
import {
  baseName, filterEntries, folderAge, recentFolders, splitCrumb, type DirEntry, type DirListing,
} from "./folder-picker-logic";

interface GitInfo { is_repo?: boolean; branch?: string; dirty?: number }

function GitNote({ entry, info }: { entry: DirEntry; info: GitInfo }): ReactNode {
  if (!info.is_repo) return <><b>{entry.name}</b> is not a git repo.</>;
  const dirty = info.dirty ? ` with ${info.dirty} uncommitted file${info.dirty > 1 ? "s" : ""}. A new worktree will branch from ` : ". A new worktree will branch from ";
  return <><b>{entry.name}</b> is a git repo on <span className="mono ac" style={{ color: "var(--accent)" }}>{info.branch}</span>{dirty}<span className="mono">{info.branch}</span>.</>;
}

function Places({ listing, machine, onLoad, onPick }: {
  listing: DirListing; machine: string | null; onLoad: (p: string) => void; onPick: (e: DirEntry) => void;
}) {
  const spaces = useStore((s) => s.spaces);
  const recent = recentFolders(spaces, machine);
  const repos = listing.entries.filter((e) => e.is_git).slice(0, 6);
  return (
    <div className="fp-pl">
      <div className="meta">Places</div>
      {listing.roots.map((r, i) => (
        <button key={r} className={`pl${r === listing.path ? " on" : ""}`} title={r} onClick={() => onLoad(r)}>
          <Icon name={i ? "folder" : "home"} />{i ? baseName(r) : "Home"}
        </button>
      ))}
      {recent.length ? <div className="meta" style={{ paddingTop: 12 }}>Recent on {machine || "this computer"}</div> : null}
      {recent.map((r) => <button key={r} className="pl" title={r} onClick={() => onLoad(r)}><span className="mono trunc">{r}</span></button>)}
      {repos.length ? <div className="meta" style={{ paddingTop: 12 }}>Git repos found</div> : null}
      {repos.map((e) => <button key={e.path} className="pl" onClick={() => onPick(e)}>
        <span className="grow trunc">{e.name}</span><span className="gitpill">git</span></button>)}
    </div>
  );
}

function FolderPicker({ machine: initialMachine, start, onDone }: { machine: string | null; start: string; onDone: (v: string | null) => void }) {
  const [machine, setMachine] = useState<string | null>(initialMachine);
  const [listing, setListing] = useState<DirListing | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [note, setNote] = useState<ReactNode>(null);
  const machines = useStore((s) => s.raw.machines) as Machine[] | undefined;
  const modal = useRef<HTMLDivElement>(null);
  const call = (method: string, params: Record<string, unknown>) => conn.rpc(method, machine ? { ...params, machine } : params);

  const load = async (path: string) => {
    try { const l: DirListing = await call("fs.list_dirs", { path }); setListing(l); setChosen(l.path); }
    catch (e) { errorToast(e); }
  };
  useEffect(() => { void load(machine === initialMachine ? start : ""); modal.current?.focus(); }, [machine]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = async (entry: DirEntry) => {
    setChosen(entry.path);
    try { const info: GitInfo = await call("git.info", { path: entry.path }); setNote(<GitNote entry={entry} info={info} />); }
    catch { setNote(null); }
  };
  const newFolder = async () => {
    const name = window.prompt("New folder name"); // not promptText: that would close the dialog underneath
    if (!name || !listing) return;
    try { const r = await call("fs.mkdir", { parent: listing.path, name }); await load(listing.path); setChosen(r.path); }
    catch (e) { errorToast(e); }
  };
  const connected = (machines || []).filter((m) => m.status === "connected").map((m) => m.alias);
  const [dir, leaf] = splitCrumb(listing?.path || "");

  return (
    <div className="scrim" style={{ zIndex: 30 }} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onDone(null); } }}>
      <div ref={modal} className="modal fp" role="dialog" aria-modal="true" aria-label="Choose a folder" tabIndex={-1}>
        <div className="mhead">
          <h2>Choose a folder</h2><span className="meta">on</span>
          <select className="btn" aria-label="Machine" value={machine || ""}
            onChange={(e) => { setMachine(e.target.value || null); setNote(null); }}>
            {["", ...connected].map((a) => <option key={a} value={a}>{a || "This computer"}</option>)}
          </select>
          <span className="grow" />
          <label className="fq"><Icon name="search" /><input placeholder="Filter folders" aria-label="Filter folders" value={filter} onChange={(e) => setFilter(e.target.value)} /></label>
        </div>
        <div className="fp-body">
          {listing ? <Places listing={listing} machine={machine} onLoad={load} onPick={pick} /> : <div className="fp-pl" />}
          <div className="fp-main">
            <div className="fp-bar">
              <button className="btn" aria-label="Up one level" style={{ padding: "0 8px" }} onClick={() => listing?.parent && load(listing.parent)}>↑</button>
              <span className="crumb mono trunc grow">{dir}<b>{leaf}</b></span>
              <button className="btn" onClick={newFolder}>+ New folder</button>
            </div>
            <div className="list" style={{ flex: 1, padding: "6px 8px" }}>
              {listing && filterEntries(listing.entries, filter).map((e) => (
                <button key={e.path} className={`fd${chosen === e.path ? " on" : ""}`} onClick={() => pick(e)} onDoubleClick={() => load(e.path)}
                  style={e.name.startsWith(".") ? { color: "var(--dim)" } : undefined}>
                  <Icon name="folder" /><span className="grow trunc">{e.name}</span>
                  {e.is_git ? <span className="gitpill">git</span> : null}
                  <span className="meta" style={{ width: 90, textAlign: "right" }}>{e.name.startsWith(".") ? "hidden" : e.mtime ? folderAge(e.mtime) : ""}</span>
                </button>
              ))}
              {listing && !filterEntries(listing.entries, filter).length ? <div className="sec">No sub-folders</div> : null}
            </div>
            <div className="fp-note">{note}</div>
          </div>
        </div>
        <div className="mfoot">
          <span className="mono meta trunc grow">{(machine ? machine + ":" : "") + (chosen || listing?.path || "")}</span>
          <button className="btn" onClick={() => onDone(null)}>Cancel</button>
          <button className="btn pri" onClick={() => onDone(chosen || listing?.path || null)}>Use this folder</button>
        </div>
      </div>
    </div>
  );
}

function inAppPicker(machine: string | null, start: string): Promise<string | null> {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.getElementById("overlay-root")!.append(host);
    const root = createRoot(host);
    const done = (v: string | null) => { root.unmount(); host.remove(); resolve(v); };
    root.render(<FolderPicker machine={machine} start={start} onDone={done} />);
  });
}

/** Resolve to a path string or null. `machine` = null for this computer. */
export async function chooseFolder(machine: string | null, start = ""): Promise<string | null> {
  if (!machine && hasNativePicker()) {
    try { return await pickNativeFolder(start); } catch (e) { errorToast(e); }
  }
  return inAppPicker(machine, start);
}
