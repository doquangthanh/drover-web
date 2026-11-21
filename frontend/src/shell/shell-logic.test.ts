import { describe, expect, it } from "vitest";
import type { Pane } from "../core/protocol-types";
import { machineDot, mobileMode, sortedPanesOf, spaceIndicatorKind, tabStatePane } from "./shell-logic";

const pane = (id: string, state: string, space_id = "s1"): Pane => ({ id, state, space_id });

describe("spaceIndicatorKind", () => {
  it("picks the most urgent state of the space only", () => {
    const panes = [pane("1", "done"), pane("2", "working"), pane("3", "blocked", "s2")];
    expect(spaceIndicatorKind(panes, "s1")).toBe("working");
    expect(spaceIndicatorKind(panes, "s2")).toBe("blocked");
    expect(spaceIndicatorKind(panes, "s3")).toBeNull();
    expect(spaceIndicatorKind([pane("1", "done"), pane("2", "idle")], "s1")).toBe("done");
    expect(spaceIndicatorKind([pane("1", "idle")], "s1")).toBeNull();
  });
});

describe("sortedPanesOf", () => {
  it("orders blocked, done, working, idle, exited and keeps ties stable", () => {
    const panes = [pane("a", "idle"), pane("b", "working"), pane("c", "blocked"), pane("d", "working"), pane("e", "exited"), pane("f", "done")];
    expect(sortedPanesOf(panes, "s1").map((p) => p.id)).toEqual(["c", "f", "b", "d", "a", "e"]);
  });
});

describe("mobileMode / machineDot", () => {
  it("maps ui to phone screen", () => {
    expect(mobileMode("workspace", null)).toBe("home");
    expect(mobileMode("workspace", "%1")).toBe("pane");
    expect(mobileMode("inbox", "%1")).toBe("view");
  });
  it("maps machine status to a dot colour", () => {
    expect(machineDot("local")).toBe("ok");
    expect(machineDot("connected")).toBe("ok");
    expect(machineDot("error")).toBe("bad");
    expect(machineDot("connecting")).toBe("blocked");
  });
});

describe("tabStatePane", () => {
  const inTab = (id: string, state: string, tab_id = "t1"): Pane => ({ ...pane(id, state), tab_id });
  it("shows a blocked helper over the focused pane, but only from the same tab", () => {
    const focused = inTab("1", "idle");
    const panes = [focused, inTab("2", "working"), inTab("3", "blocked"), inTab("4", "blocked", "t2")];
    expect(tabStatePane(panes, "t1", focused)?.id).toBe("3");
    expect(tabStatePane([focused, inTab("2", "working")], "t1", focused)?.id).toBe("2");
  });
  it("keeps the focused pane when nothing else is more urgent", () => {
    const focused = inTab("1", "working");
    expect(tabStatePane([focused, inTab("2", "idle"), inTab("3", "exited")], "t1", focused)?.id).toBe("1");
    expect(tabStatePane([], "t1", undefined)).toBeUndefined();
  });
});
