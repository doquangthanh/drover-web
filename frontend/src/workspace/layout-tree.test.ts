import { describe, expect, it } from "vitest";
import { clampRatio, containsPane, dragRatio, withRatioAt, type Node } from "./layout-tree";

const tree: Node = {
  split: "row", ratio: 0.5, a: { pane: "1" },
  b: { split: "col", ratio: 0.5, a: { pane: "2" }, b: { pane: "3" } },
};

describe("layout tree", () => {
  it("finds panes in nested splits", () => {
    expect(containsPane(tree, "3")).toBe(true);
    expect(containsPane(tree, "9")).toBe(false);
    expect(containsPane(tree, null)).toBe(false);
  });

  it("sets a ratio at a path without mutating", () => {
    const next = withRatioAt(tree, "b", 0.7) as Extract<Node, { split: string }>;
    expect((next.b as { ratio: number }).ratio).toBe(0.7);
    expect(next.ratio).toBe(0.5);
    expect((tree as { b: { ratio: number } }).b.ratio).toBe(0.5);
    expect(next.a).toBe((tree as { a: Node }).a);
  });

  it("clamps ratios like the daemon", () => {
    expect(clampRatio(0)).toBe(0.1);
    expect(clampRatio(2)).toBe(0.9);
    expect((withRatioAt(tree, "", 5) as { ratio: number }).ratio).toBe(0.9);
  });

  it("computes the drag ratio on the split axis", () => {
    const rect = { left: 100, top: 0, width: 200, height: 400 };
    expect(dragRatio("row", rect, 200, 10)).toBe(0.5);
    expect(dragRatio("col", rect, 0, 100)).toBe(0.25);
  });
});
