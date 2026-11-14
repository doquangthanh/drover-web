import { describe, expect, it } from "vitest";
import { parseDiff } from "./diff-parse";

const SAMPLE = [
  "diff --git a/f b/f", "index 1..2 100644", "--- a/f", "+++ b/f",
  "@@ -10,3 +20,3 @@ fn", " keep", "-gone", "+new", " tail",
].join("\n");

describe("parseDiff", () => {
  it("returns no rows for empty or header-only text", () => {
    expect(parseDiff("")).toEqual([]);
    expect(parseDiff(null)).toEqual([]);
    expect(parseDiff("diff --git a/x b/x\nindex 1..2\n--- a/x\n+++ b/x")).toEqual([]);
  });
  it("drops file headers and keeps the hunk header", () => {
    const rows = parseDiff(SAMPLE);
    expect(rows[0]).toEqual({ cls: "h", text: "@@ -10,3 +20,3 @@ fn" });
    expect(rows).toHaveLength(5);
  });
  it("numbers context/added by new line and removed by old line", () => {
    const [, keep, gone, added, tail] = parseDiff(SAMPLE);
    expect(keep).toMatchObject({ cls: "", n: " 20" });
    expect(gone).toMatchObject({ cls: "r", n: " 11" });
    expect(added).toMatchObject({ cls: "a", n: " 21" });
    expect(tail).toMatchObject({ cls: "", n: " 22" });
  });
  it("keeps blank context lines visible", () => {
    const rows = parseDiff("@@ -1 +1 @@\n\n+x");
    expect(rows[1].text).toBe("  ");
  });
});
