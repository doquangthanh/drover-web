import { describe, expect, it } from "vitest";
import { quickfixItems } from "./quickfix-logic";

const cwd = "/w/p";

describe("quickfixItems", () => {
  it("lists the file:line references of failed steps only", () => {
    const items = quickfixItems([
      { name: "tsc", status: "failed", output: "src/a.ts:3:5 - error TS2322: bad\nsrc/b.ts(10,2): error TS1\nsummary: 2 errors" },
      { name: "lint", status: "passed", output: "src/c.ts:1:1 warning" },
    ], cwd);
    expect(items.map((i) => [i.path, i.line, i.col])).toEqual([["src/a.ts", 3, 5], ["src/b.ts", 10, 2]]);
    expect(items[0].step).toBe("tsc");
    expect(items[0].text).toContain("TS2322");
  });
  it("drops duplicates and paths outside the space", () => {
    const items = quickfixItems([{ name: "t", status: "failed", output: "a.ts:1\na.ts:1\n/other/x.ts:2\n../up.ts:4" }], cwd);
    expect(items.map((i) => i.path)).toEqual(["a.ts"]);
  });
  it("is empty when every step passed or has no output", () => {
    expect(quickfixItems([{ name: "t", status: "passed", output: "a.ts:1" }, { name: "u", status: "failed", output: "" }], cwd)).toEqual([]);
  });
});
