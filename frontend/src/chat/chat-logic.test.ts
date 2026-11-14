import { describe, expect, it } from "vitest";
import { appendDelta, diffCounts, editDiff, formatDuration, mergeHistory, permissionQuestion, toolSummary, upsertItem } from "./chat-logic";
import type { ChatItem, PermissionItem, TextItem, ToolItem } from "./chat-types";

const text = (id: string, t: string, live = false): TextItem => ({ id, kind: "text", text: t, live });
const tool = (id: string, name: string, input: Record<string, unknown>): ToolItem => ({ id, kind: "tool", name, input, status: "running", result: null, is_error: false });

describe("transcript updates", () => {
  it("upsert appends new ids and replaces in place", () => {
    const a = text("a", "1"), b = text("b", "2");
    const list = upsertItem(upsertItem([], a), b);
    expect(upsertItem(list, text("a", "changed")).map((i) => (i as TextItem).text)).toEqual(["changed", "2"]);
    expect(list).toHaveLength(2); // the original array is untouched
  });
  it("deltas grow text and thinking items only", () => {
    const list: ChatItem[] = [text("a", "Hel", true), tool("t", "Bash", {})];
    expect((appendDelta(list, "a", "lo")[0] as TextItem).text).toBe("Hello");
    expect(appendDelta(list, "t", "x")).toBe(list);
    expect(appendDelta(list, "missing", "x")).toBe(list);
  });
  it("history goes underneath, live updates win", () => {
    const merged = mergeHistory([text("a", "old"), text("b", "b")], [text("b", "newer"), text("c", "c")]);
    expect(merged.map((i) => (i as TextItem).text)).toEqual(["old", "newer", "c"]);
  });
});

describe("tool cards", () => {
  it("summarises the call in one line", () => {
    expect(toolSummary("Read", { file_path: "C:\\proj\\src\\pricing.tsx" })).toBe("pricing.tsx");
    expect(toolSummary("Bash", { command: "npm test\nnpm run lint" })).toBe("npm test");
    expect(toolSummary("Grep", { pattern: "TODO" })).toBe("TODO");
    expect(toolSummary("Unknown", {})).toBe("");
  });
  it("Edit becomes removed then added lines; Write is all added", () => {
    const d = editDiff("Edit", { old_string: "a\nb", new_string: "c" })!;
    expect(d.map((l) => l.sign + l.text)).toEqual(["-a", "-b", "+c"]);
    expect(diffCounts(d)).toEqual({ added: 1, removed: 2 });
    expect(editDiff("Write", { content: "x\ny" })!.every((l) => l.sign === "+")).toBe(true);
    expect(editDiff("MultiEdit", { edits: [{ old_string: "a", new_string: "b" }, { old_string: "c", new_string: "d" }] })).toHaveLength(4);
    expect(editDiff("Bash", {})).toBeNull();
    expect(editDiff("Edit", { old_string: "", new_string: "new" })).toEqual([{ sign: "+", text: "new" }]);
  });
  it("words the permission question by what is being asked", () => {
    const p = (tool: string, input: Record<string, unknown>): PermissionItem => ({ id: "p", kind: "permission", tool, input, status: "pending" });
    expect(permissionQuestion(p("Bash", { command: "ls" }))).toBe("Run this command?");
    expect(permissionQuestion(p("Edit", { file_path: "/a/b.ts" }))).toBe("Change b.ts?");
    expect(permissionQuestion(p("WebFetch", { url: "https://x.dev" }))).toBe("Allow WebFetch (https://x.dev)?");
  });
});

describe("turn summary", () => {
  it("formats durations and costs", () => {
    expect(formatDuration(450)).toBe("450 ms");
    expect(formatDuration(5200)).toBe("5.2 s");
    expect(formatDuration(42_000)).toBe("42 s");
    expect(formatDuration(125_000)).toBe("2 min 5 s");
  });
});
