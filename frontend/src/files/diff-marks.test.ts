import { describe, expect, it } from "vitest";
import { diffMarks } from "./diff-marks";

const d = (lines: string[]) => lines.join("\n");

describe("diffMarks", () => {
  it("marks added, modified and deleted lines by their line number in the new file", () => {
    const m = diffMarks(d([
      "diff --git a/a.ts b/a.ts", "--- a/a.ts", "+++ b/a.ts",
      "@@ -1,5 +1,6 @@",
      " one",
      "-two",
      "+TWO",
      " three",
      "+inserted",
      " four",
      "-gone",
      " five",
    ]));
    expect(m.modified).toEqual([2]);
    expect(m.added).toEqual([4]);
    expect(m.deleted).toEqual([6]);
  });
  it("starts each hunk at its own new line number", () => {
    const m = diffMarks(d(["@@ -1,1 +1,2 @@", " a", "+b", "@@ -10,1 +11,2 @@", " x", "+y"]));
    expect(m.added).toEqual([2, 12]);
  });
  it("treats extra added lines after a replacement as added", () => {
    const m = diffMarks(d(["@@ -1,2 +1,3 @@", "-a", "+A", "+B", " c"]));
    expect(m.modified).toEqual([1]);
    expect(m.added).toEqual([2]);
  });
  it("ignores empty input and the no-newline note", () => {
    expect(diffMarks(null)).toEqual({ added: [], modified: [], deleted: [] });
    expect(diffMarks(d(["@@ -1 +1 @@", "-a", "\\ No newline at end of file", "+b"])).modified).toEqual([1]);
  });
});
