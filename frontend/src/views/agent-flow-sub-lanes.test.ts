import { describe, expect, it } from "vitest";
import { activityBars, buildFlowEvents, subAgentPanes, SUB_KIND, withSubLanes, YOU, type AgentMessage } from "./agent-flow-logic";
import type { AgentPane } from "./views-logic";

const m = (kind: string, source: string | null, target: string | null, text = ""): AgentMessage => ({ kind, source, target, text, at: 0 });
const lead = (state: AgentPane["state"]): Map<string, AgentPane> => new Map([["lead", { id: "lead", state }]]);

const msgs = [
  m("spawn", null, "lead"),
  m("sub-start", "lead", "lead/a", "planner"),
  m("sub-start", "lead", "lead/b", "tester"),
  m("sub-done", "lead/a", "lead", "plan ready"),
];

describe("Claude Code sub-agent lanes", () => {
  it("makes one pseudo pane per sub-agent with its type as name", () => {
    const subs = subAgentPanes(msgs, lead("working"));
    expect(subs.map((s) => [s.id, s.name, s.kind, s.parent, s.state])).toEqual([
      ["lead/a", "planner", SUB_KIND, "lead", "done"],
      ["lead/b", "tester", SUB_KIND, "lead", "working"],
    ]);
  });

  it("a sub-agent still running when its pane stopped is not drawn as live", () => {
    expect(subAgentPanes(msgs, lead("idle"))[1].state).toBe("idle");
    expect(subAgentPanes(msgs, new Map())[1].state).toBe("idle");
  });

  it("puts sub lanes right after their pane", () => {
    const subs = subAgentPanes(msgs, lead("working"));
    expect(withSubLanes(["lead", "helper"], subs)).toEqual(["lead", "lead/a", "lead/b", "helper"]);
  });

  it("draws delegate / return arrows and a bar per sub-agent", () => {
    const byId = lead("working");
    const subs = subAgentPanes(msgs, byId);
    subs.forEach((s) => byId.set(s.id, s));
    const lanes = [YOU, ...withSubLanes(["lead"], subs)];
    const events = buildFlowEvents(msgs, lanes);
    expect(events.map((e) => [e.verb, e.toRight])).toEqual([
      ["started", true], ["delegates", true], ["delegates", true], ["returned", false]]);
    const bars = activityBars(msgs, lanes, byId);
    expect(bars.find((b) => b.lane === 2)).toMatchObject({ startRow: 1, endRow: 3, live: false });
    expect(bars.find((b) => b.lane === 3)).toMatchObject({ startRow: 2, endRow: 3, live: true });
  });
});
