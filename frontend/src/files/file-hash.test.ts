import { describe, expect, it } from "vitest";
import { parseFileHash } from "./file-hash";

describe("parseFileHash", () => {
  it("reads space, file, line and column", () => {
    expect(parseFileHash("#files?space=s1&file=src%2Fcore%2Fkeys.ts&line=41&col=7")).toEqual({ space: "s1", file: "src/core/keys.ts", line: 41, col: 7 });
  });
  it("line and column are optional", () => {
    expect(parseFileHash("files?space=a%20b&file=x.ts")).toEqual({ space: "a b", file: "x.ts", line: undefined, col: undefined });
  });
  it("is null for other hashes, missing parts and paths that leave the space", () => {
    expect(parseFileHash("#files")).toBeNull();
    expect(parseFileHash("#inbox")).toBeNull();
    expect(parseFileHash("#files?space=s1")).toBeNull();
    expect(parseFileHash("#files?space=s1&file=..%2Fsecret.ts")).toBeNull();
    expect(parseFileHash("#files?space=s1&file=%2Fetc%2Fpasswd")).toBeNull();
  });
  it("ignores a line that is not a positive number", () => {
    expect(parseFileHash("#files?space=s&file=a.ts&line=0&col=x")).toMatchObject({ line: undefined, col: undefined });
  });
});
