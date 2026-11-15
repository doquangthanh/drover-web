import { describe, expect, it } from "vitest";
import { diffNewSpaces } from "./new-workspace-notice";
import type { RawState } from "./protocol-types";

const raw = (local: string[], remote?: string[]): RawState => ({
  spaces: local.map((id) => ({ id })),
  machines: remote ? [{ alias: "box", status: "connected", snapshot: { spaces: remote.map((id) => ({ id: `box:${id}` })) } }] : [],
});

describe("diffNewSpaces", () => {
  it("records the first snapshot without reporting anything", () => {
    const { added, next } = diffNewSpaces(null, raw(["s1", "s2"]));
    expect(added).toEqual([]);
    expect([...next.get("")!]).toEqual(["s1", "s2"]);
  });

  it("reports a space added to a known source", () => {
    const first = diffNewSpaces(null, raw(["s1"])).next;
    expect(diffNewSpaces(first, raw(["s1", "s2"])).added.map((s) => s.id)).toEqual(["s2"]);
  });

  it("does not report spaces of a machine that just connected", () => {
    const first = diffNewSpaces(null, raw(["s1"])).next;
    expect(diffNewSpaces(first, raw(["s1"], ["a", "b"])).added).toEqual([]);
  });

  it("reports a new space on a machine already connected", () => {
    const first = diffNewSpaces(null, raw([], ["a"])).next;
    expect(diffNewSpaces(first, raw([], ["a", "b"])).added.map((s) => s.id)).toEqual(["box:b"]);
  });

  it("ignores removed spaces", () => {
    const first = diffNewSpaces(null, raw(["s1", "s2"])).next;
    expect(diffNewSpaces(first, raw(["s1"])).added).toEqual([]);
  });
});
