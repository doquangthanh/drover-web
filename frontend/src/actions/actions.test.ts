import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("../core/connection", () => ({ conn: { rpc: (...a: unknown[]) => rpc(...a), input: vi.fn() } }));

import { INITIAL_UI, useStore } from "../core/store";
import { EMPTY_RAW, derive } from "../core/store-derive";
import type { RawState } from "../core/protocol-types";
import { byMachine, layoutPaneIds } from "./action-helpers";
import { allActions } from "./build-actions";

const raw: RawState = {
  spaces: [{ id: "s1", name: "one" }, { id: "s2", name: "two" }],
  tabs: [
    { id: "t1", space_id: "s1", focused: "1", layout: { split: "row", ratio: 0.5, a: { pane: "1" }, b: { pane: "2" } } },
    { id: "t2", space_id: "s2", focused: "3", layout: { pane: "3" } },
  ],
  panes: [
    { id: "1", state: "idle", name: "a", tab_id: "t1", space_id: "s1" },
    { id: "2", state: "blocked", name: "b", tab_id: "t1", space_id: "s1" },
    { id: "3", state: "done", name: "c", tab_id: "t2", space_id: "s2" },
  ],
  stopped: [], machines: [], policy_pending: [],
};

beforeEach(() => {
  rpc.mockReset().mockResolvedValue({});
  useStore.setState({ ...derive(EMPTY_RAW), raw: EMPTY_RAW, ui: { ...INITIAL_UI } });
  useStore.getState().setRaw(raw);
  useStore.getState().setUi({ view: "files", mobilePane: "x" });
});

describe("helpers", () => {
  it("groups ids by machine", () => {
    const g = byMachine(["vps:%1", "%2", "vps:%3"]);
    expect(g.get("vps")).toEqual(["vps:%1", "vps:%3"]);
    expect(g.get(null)).toEqual(["%2"]);
  });
  it("lists layout panes in order", () => {
    expect(layoutPaneIds(useStore.getState().tabById.get("t1"))).toEqual(["1", "2"]);
  });
});

describe("navigation actions", () => {
  it("focusPane switches tab/space/view and tells the daemon", () => {
    allActions.focusPane("3", true);
    const ui = useStore.getState().ui;
    expect([ui.focusedPane, ui.tabId, ui.spaceId, ui.view, ui.mobilePane]).toEqual(["3", "t2", "s2", "workspace", "3"]);
    expect(rpc).toHaveBeenCalledWith("pane.focus", { pane: "3" });
  });
  it("selectSpace picks its first tab and focused pane", () => {
    allActions.selectSpace("s2");
    expect(useStore.getState().ui).toMatchObject({ spaceId: "s2", tabId: "t2", focusedPane: "3", view: "workspace" });
  });
  it("show leaves the phone terminal unless going to the workspace", () => {
    allActions.show("inbox");
    expect(useStore.getState().ui).toMatchObject({ view: "inbox", mobilePane: null });
  });
  it("nextBlocked focuses the blocked agent; focusNext cycles inside the tab", () => {
    allActions.selectSpace("s1");
    allActions.nextBlocked();
    expect(useStore.getState().ui.focusedPane).toBe("2");
    allActions.focusNext();
    expect(useStore.getState().ui.focusedPane).toBe("1");
  });
  it("gotoTab uses the digit key within the selected space", () => {
    allActions.selectSpace("s1");
    allActions.gotoTab({ key: "1" });
    expect(useStore.getState().ui.tabId).toBe("t1");
    allActions.gotoTab({ key: "5" });
    expect(useStore.getState().ui.tabId).toBe("t1");
  });
  it("toggleSidebar flips the flag", () => {
    allActions.toggleSidebar();
    expect(useStore.getState().ui.sidebar).toBe(false);
  });
});
