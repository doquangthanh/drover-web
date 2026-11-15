// Tab and space actions: select, create, close, rename, cycle.
import { confirmBox, promptText } from "../overlays/modal-dialogs";
import { panesOf, rpc, rpcQuiet, setUi, space, state, tab, tabsOf, ui, withMachine } from "./action-helpers";
import { renameInPlace, useRenaming } from "../core/inline-rename-store";
import { hooks } from "./feature-hooks";
import { expectNewWorkspace } from "../core/new-workspace-notice";
import { focusPane } from "./pane-actions";

function selectSpace(spaceId: string): void {
  const t = tabsOf(spaceId)[0];
  setUi({ spaceId, tabId: t ? t.id : null, focusedPane: t?.focused || null, view: "workspace" });
}

function selectTab(tabId: string): void {
  const t = tab(tabId);
  if (!t) return;
  setUi({ tabId, spaceId: t.space_id, focusedPane: t.focused || null, view: "workspace" });
  setTimeout(() => { if (!useRenaming.getState().key) hooks.focusTerminal(ui().focusedPane); }, 30);
}

async function newSpace(machine?: string | null): Promise<void> {
  const path = await hooks.chooseFolder(machine || null, "");
  if (!path) return;
  expectNewWorkspace();
  const r = await rpcQuiet("space.create", machine ? { cwd: path, machine } : { cwd: path });
  if (r) focusPane(r.pane.id);
}

function newTab(): void {
  const s = space(ui().spaceId);
  if (!s) return hooks.openNewAgent({});
  rpcQuiet("pane.create", withMachine({ command: "", cwd: s.cwd }, s)).then((p) => p && focusPane(p.id));
}

async function closeSpace(spaceId?: unknown): Promise<void> {
  const s = space(typeof spaceId === "string" ? spaceId : ui().spaceId);
  if (!s) return;
  const count = panesOf(s.id).filter((p) => p.state !== "exited").length;
  const detail = count ? `${count} agent${count > 1 ? "s" : ""} running in it will stop. The folder itself is not touched.`
    : "The folder itself is not touched.";
  if (!(await confirmBox(`Close ${s.name}?`, detail, "Close", true))) return;
  rpc("space.remove", { space: s.id }).then(() => {
    if (ui().spaceId === s.id) setUi({ spaceId: null, tabId: null, focusedPane: null });
  }).catch(() => {});
}

async function renameSpace(spaceId: string): Promise<void> {
  const s = space(spaceId);
  if (!s) return;
  if (renameInPlace(`space:${s.id}`, "#sidebar")) return;
  const name = await promptText("Rename workspace", s.name);
  if (name) rpcQuiet("space.rename", withMachine({ space: s.id, name }, s));
}

async function closeTab(tabId: string): Promise<void> {
  const t = tab(tabId);
  if (!t || !(await confirmBox(`Close tab ${t.name}?`, "Every agent in this tab stops.", "Close", true))) return;
  rpcQuiet("tab.close", { tab: tabId });
}

async function renameTab(tabId: string): Promise<void> {
  const t = tab(tabId);
  if (!t) return;
  if (renameInPlace(`tab:${t.id}`, "#topbar")) return;
  const name = await promptText("Rename tab", t.name);
  if (name) rpcQuiet("tab.rename", { tab: tabId, name });
}

function cycleTab(delta = 1): void {
  const tabs = tabsOf(ui().spaceId);
  const i = tabs.findIndex((t) => t.id === ui().tabId);
  if (tabs.length) selectTab(tabs[(i + delta + tabs.length) % tabs.length].id);
}

function switchSpace(): void {
  const spaces = state().spaces;
  const i = spaces.findIndex((x) => x.id === ui().spaceId);
  if (spaces.length) selectSpace(spaces[(i + 1) % spaces.length].id);
}

export const tabSpaceActions = {
  setSpaceName: (spaceId: string, name: string) => { const s = space(spaceId); if (s) rpcQuiet("space.rename", withMachine({ space: s.id, name }, s)); },
  setTabName: (tabId: string, name: string) => { rpcQuiet("tab.rename", { tab: tabId, name }); },
  selectSpace, selectTab, newSpace, newTab, closeSpace, closeTab, renameTab, renameSpace, switchSpace,
  nextTab: () => cycleTab(1),
  prevTab: () => cycleTab(-1),
  closeCurrentTab: () => { const id = ui().tabId; if (id) void closeTab(id); },
  gotoTab: ({ key }: { key: string }) => { const t = tabsOf(ui().spaceId)[Number(key) - 1]; if (t) selectTab(t.id); },
};
