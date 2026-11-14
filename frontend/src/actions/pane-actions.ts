// Pane-level actions: focus, split, close, rename, zoom, find, restart, cycling, session resume/discard.
import { conn } from "../core/connection";
import { confirmBox, promptText } from "../overlays/modal-dialogs";
import {
  byMachine, focusedId, layoutPaneIds, pane, rpc, rpcQuiet, setUi, state, tab, ui, withMachine, type PaneOpts,
} from "./action-helpers";
import { renameInPlace, useRenaming } from "../core/inline-rename-store";
import { hooks } from "./feature-hooks";

let previousPane: string | null = null; // for "last pane" (Ctrl+A ;)

export function focusPane(paneId: string, fromClick = false): void {
  const p = pane(paneId);
  if (!p) return;
  if (ui().focusedPane && ui().focusedPane !== paneId) previousPane = ui().focusedPane;
  // One batched update; the workspace/topbar react to it, no manual "force render" needed.
  setUi({ focusedPane: paneId, tabId: p.tab_id ?? null, spaceId: p.space_id ?? null, mobilePane: paneId, view: "workspace" });
  conn.rpc("pane.focus", { pane: paneId }).catch(() => {});
  if (!fromClick) setTimeout(() => { if (!useRenaming.getState().key) hooks.focusTerminal(paneId); }, 30);
}

export function mobileBack(): void { setUi({ mobilePane: null }); }

export function sendRaw(paneId: string, data: string): void { conn.input(paneId, data); }

function split(direction: "row" | "col", opts?: PaneOpts): void {
  const p = pane(focusedId(opts));
  if (!p) return hooks.openNewAgent({});
  const params = withMachine({ command: "", cwd: p.cwd, tab_id: p.tab_id, split_from: p.id, direction }, p);
  rpcQuiet("pane.create", params).then((created) => created && focusPane(created.id));
}

function cycle(states: string[]): void {
  const list = state().panes.filter((p) => states.includes(p.state));
  if (!list.length) return;
  const i = list.findIndex((p) => p.id === ui().focusedPane);
  focusPane(list[(i + 1) % list.length].id);
}

function step(delta: number): void {
  const ids = layoutPaneIds(tab(ui().tabId));
  if (!ids.length) return;
  const i = ids.indexOf(ui().focusedPane || "");
  focusPane(ids[(i + delta + ids.length) % ids.length]);
}

async function closePane(opts?: PaneOpts): Promise<void> {
  const p = pane(focusedId(opts));
  if (!p) return;
  if (p.state === "working" && !(await confirmBox(`Stop ${p.name}?`, "It is still working.", "Stop", true))) return;
  rpc("pane.close", { pane: p.id }).then(() => setUi({ focusedPane: null })).catch(() => {});
}

async function rename(opts?: PaneOpts): Promise<void> {
  const p = pane(focusedId(opts));
  if (!p) return;
  if (renameInPlace(`pane:${p.id}`, "#sidebar")) return; // the sidebar row turns into a text field
  const name = await promptText("Rename agent", p.name);
  if (name) rpcQuiet("pane.rename", { pane: p.id, name });
}

function zoom(opts?: PaneOpts): void {
  const t = tab(ui().tabId);
  if (!t) return;
  if (opts?.paneId) setUi({ focusedPane: opts.paneId });
  const focused = ui().focusedPane;
  if (focused && t.focused !== focused) conn.rpc("pane.focus", { pane: focused }).catch(() => {});
  rpcQuiet("tab.zoom", { tab: t.id, zoomed: !t.zoomed });
}

function find(opts?: PaneOpts): void {
  const id = focusedId(opts);
  if (opts?.query === undefined && ui().findPane === id && id) { hooks.copySelection(id); setUi({ findPane: null }); }
  else setUi({ findPane: id });
}

function restart(opts?: PaneOpts): void {
  const id = focusedId(opts);
  if (id) rpcQuiet("pane.restart", { pane: id }).then((p) => p && focusPane(p.id));
}

function resume(ids: string[], fresh = false): void {
  for (const [machine, panes] of byMachine(ids)) rpcQuiet("session.resume", machine ? { panes, fresh, machine } : { panes, fresh });
}

function discard(ids?: string[]): void {
  if (!ids) { rpcQuiet("session.discard", {}); return; } // restore dialog: this computer
  for (const [machine, panes] of byMachine(ids)) rpcQuiet("session.discard", machine ? { panes, machine } : { panes });
}

export const paneActions = {
  setPaneName: (id: string, name: string) => { rpcQuiet("pane.rename", { pane: id, name }); },
  focusPane, mobileBack, sendRaw, closePane, rename, zoom, find, restart, resume, discard,
  splitRight: (opts?: PaneOpts) => split("row", opts),
  splitDown: (opts?: PaneOpts) => split("col", opts),
  sendEsc: (opts?: PaneOpts) => { const id = focusedId(opts); if (id) sendRaw(id, "\x1b"); },
  nextBlocked: () => cycle(["blocked"]),
  nextDone: () => cycle(["done"]),
  lastPane: () => { if (previousPane && pane(previousPane)) focusPane(previousPane); },
  focusPrev: () => step(-1),
  focusNext: () => step(1),
  testNotify: () => { rpcQuiet("notify.test"); },
};
