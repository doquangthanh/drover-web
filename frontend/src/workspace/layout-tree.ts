// Pure helpers for the split layout tree the daemon stores per tab (see core/split_layout_tree.py):
//   leaf  { pane }          split { split: "row" | "col", ratio, a, b }
export type SplitDir = "row" | "col";
export type Leaf = { pane: string };
export type Split = { split: SplitDir; ratio: number; a: Node; b: Node };
export type Node = Leaf | Split;

export const isLeaf = (n: Node): n is Leaf => "pane" in n && typeof (n as Leaf).pane === "string";

export const clampRatio = (r: number): number => Math.max(0.1, Math.min(0.9, r));

export function containsPane(node: Node | null | undefined, paneId: string | null): boolean {
  if (!node || !paneId) return false;
  return isLeaf(node) ? node.pane === paneId : containsPane(node.a, paneId) || containsPane(node.b, paneId);
}

/** Copy of `node` with the split at `path` ("" = root, then "a"/"b" steps) given a new ratio. Unknown path: unchanged. */
export function withRatioAt(node: Node, path: string, ratio: number): Node {
  if (isLeaf(node)) return node;
  if (!path) return { ...node, ratio: clampRatio(ratio) };
  const side = path[0] as "a" | "b";
  return { ...node, [side]: withRatioAt(node[side], path.slice(1), ratio) };
}

/** Copy with the nearest split around `paneId` that runs along `axis` ("row" = left/right) moved by `delta`; same tree if none. */
export function nudgeRatio(node: Node, paneId: string, axis: SplitDir, delta: number): Node {
  if (isLeaf(node)) return node;
  const inA = containsPane(node.a, paneId);
  if (!inA && !containsPane(node.b, paneId)) return node;
  const child = inA ? node.a : node.b;
  const deeper = nudgeRatio(child, paneId, axis, delta);
  if (deeper !== child) return inA ? { ...node, a: deeper } : { ...node, b: deeper };
  return node.split === axis ? { ...node, ratio: clampRatio(node.ratio + delta) } : node;
}

/** Copy with two panes exchanging places. */
export function swapLeaves(node: Node, a: string, b: string): Node {
  if (isLeaf(node)) return node.pane === a ? { pane: b } : node.pane === b ? { pane: a } : node;
  return { ...node, a: swapLeaves(node.a, a, b), b: swapLeaves(node.b, a, b) };
}

/** Ratio of the pointer inside a box along the split axis. */
export function dragRatio(dir: SplitDir, rect: { left: number; top: number; width: number; height: number }, x: number, y: number): number {
  return clampRatio(dir === "row" ? (x - rect.left) / rect.width : (y - rect.top) / rect.height);
}
