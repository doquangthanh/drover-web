import { describe, expect, it } from "vitest";
import { ago, shortPath } from "./format";

describe("ago", () => {
  const now = 1_000_000 * 1000;
  it.each([[0, "<1m"], [4, "<1m"], [30, "30s"], [120, "2m"], [7200, "2h"], [172800, "2d"]])("%is -> %s", (secs, out) => {
    expect(ago(1_000_000 - secs, now)).toBe(out);
  });
  it("never negative for future timestamps", () => expect(ago(1_000_100, now)).toBe("<1m"));
});

describe("shortPath", () => {
  it("handles empty", () => { expect(shortPath("")).toBe(""); expect(shortPath(null)).toBe(""); });
  it("keeps short paths", () => expect(shortPath("/a/b/c")).toBe("/a/b/c"));
  it("abbreviates long and windows paths", () => {
    expect(shortPath("/a/b/c/d")).toBe("…/c/d");
    expect(shortPath("C:\\Users\\me\\proj\\drover")).toBe("…/proj/drover");
  });
});
