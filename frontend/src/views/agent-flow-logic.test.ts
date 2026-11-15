import { describe, expect, it } from "vitest";
import {
  activityBars, buildFlowEvents, rootOf, stateCounts, subtreeIds, touches, YOU, type AgentMessage,
} from "./agent-flow-logic";
import type { AgentPane } from "./views-logic";

const p = (id: string, extra: Partial<AgentPane> = {}): AgentPane => ({ id, state: "idle", ...extra });
const m = (kind: string, source: string | null, target: string | null, at = 0): AgentMessage => ({ kind, source, target, at });
const index = (panes: AgentPane[]) => new Map(panes.map((x) => [x.id, x]));

const panes = [p("lead", { state: "working" }), p("a", { parent: "lead", state: "done" }),
  p("b", { parent: "lead", state: "blocked" }), p("solo")];

describe("tree walking", () => {
  it("finds the root and keeps tree order", () => {
    expect(rootOf("b", index(panes))).toBe("lead");
    expect(rootOf("gone", index(panes))).toBe("gone");
    expect(subtreeIds("lead", panes)).toEqual(["lead", "a", "b"]);
  });

  it("treats a helper of a closed parent as a root", () => {
    expect(rootOf("x", index([p("x", { parent: "closed" })]))).toBe("x");
  });
});

describe("buildFlowEvents", () => {
  const lanes = [YOU, "lead", "a", "b"];

  it("points right from parent to helper and left back", () => {
    const [start, done] = buildFlowEvents([m("spawn", "lead", "a"), m("done", "a", "lead")], lanes);
    expect(start).toMatchObject({ toRight: true, fromPct: 37.5, leftPct: 37.5, widthPct: 25, midPct: 50, verb: "started" });
    expect(done).toMatchObject({ toRight: false, fromPct: 62.5, leftPct: 37.5, widthPct: 25 });
  });

  it("maps the user and unknown panes to the you lane", () => {
    const [fromYou, unknown] = buildFlowEvents([m("spawn", null, "lead"), m("send", "elsewhere", "b")], lanes);
    expect(fromYou).toMatchObject({ source: YOU, fromPct: 12.5, toRight: true });
    expect(unknown).toMatchObject({ source: "elsewhere", fromPct: 12.5 });
  });

  it("returns nothing for no messages", () => {
    expect(buildFlowEvents([], lanes)).toEqual([]);
  });
});

describe("activityBars", () => {
  const lanes = [YOU, "lead", "a", "b"];
  const msgs = [m("spawn", null, "lead"), m("spawn", "lead", "a"), m("done", "a", "lead"),
    m("spawn", "lead", "b"), m("done", "a", "lead"), m("blocked", "b", "lead")];

  it("runs from the spawn to the last done, and to the end while live", () => {
    const bars = activityBars(msgs, lanes, index(panes));
    expect(bars.find((b) => b.lane === 2)).toMatchObject({ startRow: 1, endRow: 4, live: false });
    expect(bars.find((b) => b.lane === 3)).toMatchObject({ startRow: 3, endRow: 5, live: true });
    expect(bars.find((b) => b.lane === 1)).toMatchObject({ startRow: 0, endRow: 5, live: true });
    expect(bars.some((b) => b.lane === 0)).toBe(false);
  });

  it("ends a finished root at its last mention (roots log no done)", () => {
    const idleRoot = index([p("lead", { state: "idle" }), p("a", { parent: "lead", state: "done" })]);
    const bars = activityBars([m("spawn", null, "lead"), m("spawn", "lead", "a"), m("done", "a", "lead"), m("send", "a", "x")],
      [YOU, "lead", "a"], idleRoot);
    expect(bars.find((b) => b.lane === 1)).toMatchObject({ startRow: 0, endRow: 2, live: false });
  });

  it("ends a helper that exited (no done) at its exit row", () => {
    const exited = index([p("lead", { state: "working" }), p("a", { parent: "lead", state: "exited" })]);
    const bars = activityBars([m("spawn", "lead", "a"), m("exited", "a", "lead"), m("send", "lead", "x")],
      [YOU, "lead", "a"], exited);
    expect(bars.find((b) => b.lane === 2)).toMatchObject({ startRow: 0, endRow: 1, live: false });
  });

  it("falls back to the first mention when the spawn scrolled out of the log", () => {
    const bars = activityBars([m("send", "lead", "a"), m("done", "a", "lead")], lanes, index(panes));
    expect(bars.find((b) => b.lane === 2)).toMatchObject({ startRow: 0, endRow: 1 });
  });
});

describe("counts and filters", () => {
  it("counts states", () => {
    expect(stateCounts(panes)).toMatchObject({ working: 1, done: 1, blocked: 1, idle: 1, exited: 0 });
  });

  it("matches messages touching a set, including you", () => {
    expect(touches(m("send", "a", "lead"), new Set(["a"]))).toBe(true);
    expect(touches(m("spawn", null, "x"), new Set([YOU]))).toBe(true);
    expect(touches(m("send", "x", "y"), new Set(["a"]))).toBe(false);
  });
});
