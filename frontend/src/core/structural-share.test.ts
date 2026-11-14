import { describe, expect, it } from "vitest";
import { replaceEqual } from "./structural-share";

describe("replaceEqual", () => {
  it("returns prev for deep-equal data", () => {
    const prev = { a: [1, { b: 2 }], c: "x" };
    expect(replaceEqual(prev, { a: [1, { b: 2 }], c: "x" })).toBe(prev);
  });

  it("reuses unchanged children when a sibling changes", () => {
    const prev = { panes: [{ id: "1", s: "a" }, { id: "2", s: "a" }] };
    const next = replaceEqual(prev, { panes: [{ id: "1", s: "a" }, { id: "2", s: "b" }] });
    expect(next).not.toBe(prev);
    expect(next.panes[0]).toBe(prev.panes[0]);
    expect(next.panes[1]).not.toBe(prev.panes[1]);
  });

  it("detects added/removed keys and length changes", () => {
    const prev = { a: 1 };
    expect(replaceEqual(prev, { a: 1, b: 2 })).not.toBe(prev);
    const arr = [1, 2];
    expect(replaceEqual(arr, [1])).toEqual([1]);
  });
});
