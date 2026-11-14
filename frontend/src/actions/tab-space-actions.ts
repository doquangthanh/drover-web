// Tab and space actions: select, create, close, rename, cycle.
import { confirmBox, promptText } from "../overlays/modal-dialogs";
import { panesOf, rpc, rpcQuiet, setUi, space, state, tab, tabsOf, ui, withMachine } from "./action-helpers";
import { hooks } from "./feature-hooks";
import { focusPane } from "./pane-actions";

function selectSpace(spaceId: string): void {
  const t = tabsOf(spaceId)[0];
  setUi({ spaceId, tabId: t ? t.id : null, focusedPane: t?.focused || null, view: "workspace" });
}

function selectTab(tabId: string): void {
  const t = tab(tabId);
  if (!t) return;
  setUi({ tabId, spaceId: t.space_id, focusedPane: t.focused || null, view: "workspace" });
  setTimeout(() => hooks.focusTerminal(ui().focusedPane), 30);
}

async function newSpace(machine?: string | null): Promise<void> {
  const path = await hooks.chooseFolder(machine || null, "");
  if (!path) return;
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

async function closeTab(tabId: string): Promise<void> {
  const t = tab(tabId);
  if (!t || !(await confirmBox(`Close tab ${t.name}?`, "Every agent in this tab stops.", "Close", true))) return;
  rpcQuiet("tab.close", { tab: tabId });
}

async function renameTab(tabId: string): Promise<void> {
  const t = tab(tabId);
  if (!t) return;
  const name = await promptText("Rename tab", t.name);
  if (name) rpcQuiet("tab.rename", { tab: tabId, name });
}

function cycleTab(): void {
  const tabs = tabsOf(ui().spaceId);
  const i = tabs.findIndex((t) => t.id === ui().tabId);
  if (tabs.length) selectTab(tabs[(i + 1) % tabs.length].id);
}

function switchSpace(): void {
  const spaces = state().spaces;
  const i = spaces.findIndex((x) => x.id === ui().spaceId);
  if (spaces.length) selectSpace(spaces[(i + 1) % spaces.length].id);
}

export const tabSpaceActions = {
  selectSpace, selectTab, newSpace, newTab, closeSpace, closeTab, renameTab, switchSpace,
  nextTab: cycleTab,
  gotoTab: ({ key }: { key: string }) => { const t = tabsOf(ui().spaceId)[Number(key) - 1]; if (t) selectTab(t.id); },
};
