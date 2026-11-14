// Which pane lies in a direction from another one (pure: works on measured boxes, so it is easy to test).
export type Dir = "left" | "right" | "up" | "down";
export interface Box { id: string; left: number; top: number; right: number; bottom: number }

const SLACK = 1; // px: neighbouring panes touch at the gutter

/** Nearest pane strictly beyond `fromId`'s edge in `dir`; being off the movement line costs double. */
export function neighbour(boxes: Box[], fromId: string, dir: Dir): string | null {
  const from = boxes.find((b) => b.id === fromId);
  if (!from) return null;
  const horizontal = dir === "left" || dir === "right";
  const cx = (from.left + from.right) / 2, cy = (from.top + from.bottom) / 2;
  let best: string | null = null, bestCost = Infinity;
  for (const b of boxes) {
    if (b.id === fromId) continue;
    const ahead = dir === "left" ? b.right <= from.left + SLACK : dir === "right" ? b.left >= from.right - SLACK
      : dir === "up" ? b.bottom <= from.top + SLACK : b.top >= from.bottom - SLACK;
    if (!ahead) continue;
    const dx = Math.abs((b.left + b.right) / 2 - cx), dy = Math.abs((b.top + b.bottom) / 2 - cy);
    const cost = horizontal ? dx + dy * 2 : dy + dx * 2;
    if (cost < bestCost) { bestCost = cost; best = b.id; }
  }
  return best;
}
