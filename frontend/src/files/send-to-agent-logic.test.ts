import { describe, expect, it } from "vitest";
import type { Pane } from "../core/protocol-types";
import { asPaste, formatSelection, pickAgentPane } from "./send-to-agent-logic";

const p = (id: string, state: string, kind = "claude", space_id = "s1"): Pane => ({ id, state, kind, space_id });

describe("pickAgentPane", () => {
  const panes = [p("a", "working"), p("b", "blocked"), p("c", "idle", "shell"), p("d", "done", "codex", "s2")];
  it("prefers the focused pane of the space", () => { expect(pickAgentPane(panes, "s1", "a")?.id).toBe("a"); });
  it("falls back to the most urgent agent, never a shell or another space", () => {
    expect(pickAgentPane(panes, "s1", "d")?.id).toBe("b");
    expect(pickAgentPane(panes, "s1", "c")?.id).toBe("b");
  });
  it("returns nothing when the space has no agent", () => {
    expect(pickAgentPane([p("c", "idle", "shell")], "s1", null)).toBeUndefined();
    expect(pickAgentPane([p("x", "exited")], "s1", null)).toBeUndefined();
  });
});

describe("formatSelection", () => {
  it("formats a range with a fenced snippet", () => {
    expect(formatSelection("src/a.ts", 4, 6, "x\ny\n")).toBe("src/a.ts:4-6\n```\nx\ny\n```\n");
  });
  it("uses a single line number and no fence without a selection", () => {
    expect(formatSelection("src/a.ts", 4, 4, "")).toBe("src/a.ts:4 ");
  });
});

describe("asPaste", () => { it("wraps in bracketed paste", () => { expect(asPaste("hi")).toBe("\x1b[200~hi\x1b[201~"); }); });
describe("asPaste with control characters", () => {
  it("cannot end the paste early or type keys", () => {
    expect(asPaste("a\x1b[201~rm -rf /\r\nb\tc\x07")).toBe("\x1b[200~a[201~rm -rf /\nb\tc\x1b[201~");
  });
});
