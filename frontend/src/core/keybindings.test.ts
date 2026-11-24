import { describe, expect, it } from "vitest";
import { chordOfEvent, normalizeChord, parseWebKeys } from "./keybindings";

const known = new Set(["search", "palette", "nextBlocked", "files"]);

describe("normalizeChord", () => {
  it("lower-cases, orders modifiers and accepts aliases", () => {
    expect(normalizeChord("Shift+Ctrl+P")).toBe("ctrl+shift+p");
    expect(normalizeChord("cmd+e")).toBe("meta+e");
    expect(normalizeChord("Ctrl+Esc")).toBe("ctrl+escape");
  });
  it("allows a bare F-key but not a bare letter", () => {
    expect(normalizeChord("F8")).toBe("f8");
    expect(normalizeChord("p")).toBeNull();
  });
  it("rejects junk", () => {
    expect(normalizeChord("")).toBeNull();
    expect(normalizeChord("ctrl+ctrl+p")).toBeNull();
    expect(normalizeChord("hyper+p")).toBeNull();
  });
});

describe("chordOfEvent", () => {
  it("matches normalizeChord for the same keys", () => {
    expect(chordOfEvent({ key: "P", ctrlKey: true, shiftKey: true })).toBe(normalizeChord("ctrl+shift+p"));
    expect(chordOfEvent({ key: "F8" })).toBe("f8");
    expect(chordOfEvent({ key: "ArrowLeft", ctrlKey: true })).toBe("ctrl+arrowleft");
  });
});

describe("parseWebKeys", () => {
  it("reads only the [web_keys] table, with comments, lists and quoted ids", () => {
    const wk = parseWebKeys([
      "[keys]", 'new_agent = "c"', "", "[web_keys]", "# my keys", 'search = "ctrl+e"   # jump', 'nextBlocked = ["f8", "Ctrl+J"]', '"files" = "ctrl+alt+f"', "[desktop_keys]", 'palette = "ctrl+q"',
    ].join("\n"), known);
    expect(wk.problems).toEqual([]);
    expect(wk.byChord.get("ctrl+e")).toBe("search");
    expect(wk.byChord.get("ctrl+j")).toBe("nextBlocked");
    expect(wk.byChord.get("f8")).toBe("nextBlocked");
    expect(wk.byChord.get("ctrl+alt+f")).toBe("files");
    expect(wk.byChord.has("ctrl+q")).toBe(false);
    expect([...wk.overridden].sort()).toEqual(["files", "nextBlocked", "search"]);
  });
  it("reports unknown actions, bad chords, the reserved Ctrl+K and duplicates", () => {
    const wk = parseWebKeys('[web_keys]\nnope = "ctrl+e"\nsearch = "e"\npalette = "ctrl+k"\nfiles = "ctrl+g"\nnextBlocked = "ctrl+g"', known);
    expect(wk.problems).toHaveLength(4);
    expect(wk.problems[0]).toMatch(/no action called "nope"/);
    expect(wk.problems[2]).toMatch(/Ctrl\+K/);
    expect(wk.byChord.get("ctrl+g")).toBe("nextBlocked");
  });
  it("is empty without the table", () => {
    const wk = parseWebKeys('[keys]\nnew_agent = "c"', known);
    expect(wk.byChord.size).toBe(0);
    expect(wk.problems).toEqual([]);
  });
});

import { customKeysFor, displayChord, shadowedBuiltins } from "./keybindings";

describe("display and conflicts", () => {
  it("formats chords for display", () => {
    expect(displayChord("ctrl+shift+p")).toBe("Ctrl+Shift+P");
    expect(displayChord("f8")).toBe("F8");
    expect(displayChord("ctrl+arrowleft")).toBe("Ctrl+←");
    expect(displayChord("alt+pageup")).toBe("Alt+Pageup");
  });
  it("finds the custom chord of an action", () => {
    const wk = parseWebKeys('[web_keys]\nsearch = "ctrl+e"', known);
    expect(customKeysFor(wk, "search")).toBe("Ctrl+E");
    expect(customKeysFor(wk, "files")).toBeUndefined();
  });
  it("warns when a custom chord takes another action's built-in chord", () => {
    const wk = parseWebKeys('[web_keys]\nsearch = "ctrl+b"', known);
    const builtins = new Map([["ctrl+b", "toggleSidebar"], ["ctrl+p", "search"]]);
    expect(shadowedBuiltins(wk, builtins)).toHaveLength(1);
    expect(shadowedBuiltins(wk, new Map([["ctrl+b", "search"]]))).toEqual([]);
  });
});
