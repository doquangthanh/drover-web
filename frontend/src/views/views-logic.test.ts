import { describe, expect, it } from "vitest";
import { channelLabel, inMachine, matchesFilter, treeRows, uptimeLabel, type AgentPane } from "./views-logic";

const p = (id: string, extra: Partial<AgentPane> = {}): AgentPane => ({ id, state: "idle", ...extra });

describe("inbox filters", () => {
  it("scopes by machine", () => {
    expect(inMachine(p("a"), "")).toBe(true);
    expect(inMachine(p("a"), "local")).toBe(true);
    expect(inMachine(p("a", { machine: "local" }), "local")).toBe(true);
    expect(inMachine(p("a", { machine: "vps" }), "local")).toBe(false);
    expect(inMachine(p("a", { machine: "vps" }), "vps")).toBe(true);
  });
  it("matches state filters", () => {
    expect(matchesFilter(p("a", { state: "blocked" }), "blocked")).toBe(true);
    expect(matchesFilter(p("a", { state: "done" }), "blocked")).toBe(false);
    expect(matchesFilter(p("a", { unread: true }), "unread")).toBe(true);
    expect(matchesFilter(p("a"), "all")).toBe(true);
  });
});

describe("labels", () => {
  it("formats uptime", () => {
    expect(uptimeLabel(30)).toBe("<1m");
    expect(uptimeLabel(3700)).toBe("1h 1m");
    expect(uptimeLabel(90000 + 3600 * 5)).toBe("1d 6h");
  });
  it("formats notify channels", () => {
    expect(channelLabel([])).toBe("Off");
    expect(channelLabel(["toast", "desktop"])).toBe("Toast · Desktop");
    expect(channelLabel(["toast", "desktop", "sound"], true)).toBe("All");
  });
});

describe("treeRows", () => {
  it("nests helpers and roots orphans", () => {
    const rows = treeRows([p("1"), p("2", { parent: "1" }), p("3", { parent: "1" }), p("4", { parent: "gone" })]);
    expect(rows.map((r) => [r.pane.id, r.prefix])).toEqual([["1", "├ "], ["2", "│  ├ "], ["3", "│  └ "], ["4", "└ "]]);
  });
});
