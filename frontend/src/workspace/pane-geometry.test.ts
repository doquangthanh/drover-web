import { describe, expect, it } from "vitest";
import { neighbour, type Box } from "./pane-geometry";
import { nudgeRatio, swapLeaves, type Node } from "./layout-tree";

// 2x2:  a | b
//       c | d
const grid: Box[] = [
  { id: "a", left: 0, top: 0, right: 100, bottom: 100 }, { id: "b", left: 100, top: 0, right: 200, bottom: 100 },
  { id: "c", left: 0, top: 100, right: 100, bottom: 200 }, { id: "d", left: 100, top: 100, right: 200, bottom: 200 },
];

describe("neighbour", () => {
  it("finds the pane beside / above / below, none beyond an edge", () => {
    expect(neighbour(grid, "a", "right")).toBe("b");
    expect(neighbour(grid, "a", "down")).toBe("c");
    expect(neighbour(grid, "d", "left")).toBe("c");
    expect(neighbour(grid, "d", "up")).toBe("b");
    expect(neighbour(grid, "a", "left")).toBeNull();
    expect(neighbour(grid, "a", "up")).toBeNull();
  });
  it("prefers the pane on the same row", () => {
    const tall: Box[] = [{ id: "l", left: 0, top: 0, right: 100, bottom: 200 },
      { id: "t", left: 100, top: 0, right: 200, bottom: 100 }, { id: "u", left: 100, top: 100, right: 200, bottom: 200 }];
    expect(neighbour(tall, "u", "left")).toBe("l");
    expect(neighbour(tall, "l", "right")).toBe("t");
  });
});

const tree: Node = { split: "row", ratio: 0.5, a: { pane: "1" }, b: { split: "col", ratio: 0.5, a: { pane: "2" }, b: { pane: "3" } } };

describe("nudgeRatio / swapLeaves", () => {
  it("moves the nearest split that runs along the axis", () => {
    const col = nudgeRatio(tree, "3", "col", 0.05) as Extract<Node, { split: string }>;
    expect((col.b as Extract<Node, { split: string }>).ratio).toBeCloseTo(0.55);
    expect(col.ratio).toBe(0.5);
    expect((nudgeRatio(tree, "3", "row", -0.1) as Extract<Node, { split: string }>).ratio).toBeCloseTo(0.4);
  });
  it("returns the same tree when no split fits or ratio is clamped by the caller", () => {
    expect(nudgeRatio({ pane: "1" }, "1", "row", 0.05)).toEqual({ pane: "1" });
    expect(nudgeRatio(tree, "1", "col", 0.05)).toBe(tree);
  });
  it("swaps two panes in place", () => {
    expect(swapLeaves(tree, "1", "3")).toEqual({ split: "row", ratio: 0.5, a: { pane: "3" },
      b: { split: "col", ratio: 0.5, a: { pane: "2" }, b: { pane: "1" } } });
  });
});
