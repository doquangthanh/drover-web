import { describe, expect, it } from "vitest";
import { findPathRefs, toSpacePath } from "./path-refs";

describe("findPathRefs", () => {
  it("finds a path with line and column", () => {
    const [r] = findPathRefs("error in src/core/keys.ts:41:7 here");
    expect(r).toMatchObject({ path: "src/core/keys.ts", line: 41, col: 7 });
    expect("error in src/core/keys.ts:41:7 here".slice(r.start, r.end)).toBe("src/core/keys.ts:41:7");
  });
  it("finds a path inside an agent tool line", () => {
    const text = "● Update(src/changes/diff-view.tsx)";
    const [r] = findPathRefs(text);
    expect(r.path).toBe("src/changes/diff-view.tsx");
    expect(text.slice(r.start, r.end)).toBe("src/changes/diff-view.tsx");
  });
  it("reads the (line,col) form and windows paths", () => {
    expect(findPathRefs("C:\\proj\\a.py(12,3): error")[0]).toMatchObject({ path: "C:\\proj\\a.py", line: 12, col: 3 });
  });
  it("prefers the longer extension", () => {
    expect(findPathRefs("a/b.tsx")[0].path).toBe("a/b.tsx");
    expect(findPathRefs("styles/x.css")[0].path).toBe("styles/x.css");
  });
  it("leaves URLs and plain words alone", () => {
    expect(findPathRefs("see https://github.com/a/b/c.ts for more")).toEqual([]);
    expect(findPathRefs("v1.2 e.g. done, see github.com")).toEqual([]);
  });
  it("finds relative ./ and ../ paths and several per line", () => {
    const refs = findPathRefs("./a.ts and ../b/c.py:3");
    expect(refs.map((r) => r.path)).toEqual(["./a.ts", "../b/c.py"]);
    expect(refs[1].line).toBe(3);
  });
});

describe("toSpacePath", () => {
  it("resolves a relative path against the pane folder", () => {
    expect(toSpacePath("keys.ts", "/w/p/src/core", "/w/p")).toBe("src/core/keys.ts");
    expect(toSpacePath("../a.ts", "/w/p/src/core", "/w/p")).toBe("src/a.ts");
  });
  it("accepts absolute paths inside the space and rejects outside ones", () => {
    expect(toSpacePath("/w/p/x/y.ts", "/w/p", "/w/p")).toBe("x/y.ts");
    expect(toSpacePath("/other/y.ts", "/w/p", "/w/p")).toBeNull();
    expect(toSpacePath("../../y.ts", "/w/p", "/w/p")).toBeNull();
  });
  it("handles windows drive paths, case-insensitively", () => {
    expect(toSpacePath("src\\a.ts", "C:\\Users\\me\\proj", "C:\\Users\\me\\proj")).toBe("src/a.ts");
    expect(toSpacePath("c:/users/me/proj/src/a.ts", "C:\\Users\\me\\proj", "C:\\Users\\me\\proj")).toBe("src/a.ts");
  });
  it("needs a space folder", () => { expect(toSpacePath("a.ts", "/x", undefined)).toBeNull(); });
});
