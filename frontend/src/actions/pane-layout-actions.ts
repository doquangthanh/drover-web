// Keyboard layout control for panes (tmux style): move focus by direction, resize, swap places.
import { conn } from "../core/connection";
import { nudgeRatio, swapLeaves, type Node, type SplitDir } from "../workspace/layout-tree";
import { neighbour, type Dir } from "../workspace/pane-geometry";
import { layoutPaneIds, tab, ui } from "./action-helpers";
import { focusPane, paneActions } from "./pane-actions";

const ARROW: Record<string, { dir: Dir; axis: SplitDir; sign: 1 | -1 }> = {
  ArrowLeft: { dir: "left", axis: "row", sign: -1 }, ArrowRight: { dir: "right", axis: "row", sign: 1 },
  ArrowUp: { dir: "up", axis: "col", sign: -1 }, ArrowDown: { dir: "down", axis: "col", sign: 1 },
};

function focusDir(dir: Dir): void {
  const from = ui().focusedPane;
  if (!from) return;
  const boxes = Array.from(document.querySelectorAll<HTMLElement>("[data-slot]")).map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.dataset.slot!, left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  });
  const to = neighbour(boxes, from, dir);
  if (to) focusPane(to);
  else if (dir === "left" || dir === "up") paneActions.focusPrev(); // nothing beyond the edge: keep cycling, as before
  else paneActions.focusNext();
}

function setLayout(layout: Node): void {
  const t = tab(ui().tabId);
  if (t) conn.rpc("tab.set_layout", { tab: t.id, layout }).catch(() => {});
}

/** Ctrl+arrow after the prefix: 5%, with Alt: 10%. */
function resizePane({ key, big }: { key: string; big?: boolean }): void {
  const t = tab(ui().tabId), focused = ui().focusedPane, a = ARROW[key];
  if (!t?.layout || !focused || !a) return;
  const next = nudgeRatio(t.layout as Node, focused, a.axis, a.sign * (big ? 0.1 : 0.05));
  if (next !== t.layout) setLayout(next);
}

function swapPane(delta: number): void {
  const t = tab(ui().tabId), ids = layoutPaneIds(t), focused = ui().focusedPane;
  const i = ids.indexOf(focused || "");
  if (!t?.layout || i < 0 || ids.length < 2) return;
  setLayout(swapLeaves(t.layout as Node, ids[i], ids[(i + delta + ids.length) % ids.length]));
}

export const paneLayoutActions = {
  resizePane,
  focusUp: () => focusDir("up"),
  focusDown: () => focusDir("down"),
  focusLeft: () => focusDir("left"),
  focusRight: () => focusDir("right"),
  swapPrev: () => swapPane(-1),
  swapNext: () => swapPane(1),
};
