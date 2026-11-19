import { describe, expect, it } from "vitest";
import { nextWarmTabs } from "./warm-tabs";

describe("warm tabs", () => {
  const live = new Set(["a", "b", "c", "d"]);
  it("puts the shown tab first and keeps the order of the rest", () => {
    expect(nextWarmTabs(["a", "b", "c"], "c", live)).toEqual(["c", "a", "b"]);
    expect(nextWarmTabs(["c", "a"], "c", live)).toEqual(["c", "a"]);
  });
  it("drops closed tabs and caps the list", () => {
    expect(nextWarmTabs(["a", "x", "b"], "d", live)).toEqual(["d", "a", "b"]);
    expect(nextWarmTabs(["a", "b", "c"], "d", live, 2)).toEqual(["d", "a"]);
  });
  it("keeps the rest when no tab is shown", () => {
    expect(nextWarmTabs(["a", "b"], null, live)).toEqual(["a", "b"]);
  });
});
