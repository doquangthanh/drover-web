import { describe, expect, it } from "vitest";
import { closeTab, withTab } from "./file-tabs-logic";

describe("withTab", () => {
  it("appends a new path once", () => {
    expect(withTab(undefined, "a")).toEqual(["a"]);
    expect(withTab(["a"], "b")).toEqual(["a", "b"]);
    expect(withTab(["a", "b"], "a")).toEqual(["a", "b"]);
  });
});

describe("closeTab", () => {
  it("selects the left neighbour, else the right one", () => {
    expect(closeTab(["a", "b", "c"], "b", "b")).toEqual({ tabs: ["a", "c"], file: "a" });
    expect(closeTab(["a", "b", "c"], "a", "a")).toEqual({ tabs: ["b", "c"], file: "b" });
  });
  it("keeps the selection when another tab closes", () => {
    expect(closeTab(["a", "b"], "a", "b")).toEqual({ tabs: ["b"], file: "b" });
  });
  it("leaves none selected when the last tab closes", () => {
    expect(closeTab(["a"], "a", "a")).toEqual({ tabs: [], file: null });
  });
});
