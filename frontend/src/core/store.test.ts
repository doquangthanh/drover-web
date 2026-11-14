import { beforeEach, describe, expect, it } from "vitest";
import type { Pane, RawState } from "./protocol-types";
import { INITIAL_UI, useStore } from "./store";
import { EMPTY_RAW, derive, fixSelection } from "./store-derive";

const pane = (id: string, state = "idle", extra: Partial<Pane> = {}): Pane => ({ id, state, name: id, ...extra });
const mkRaw = (): RawState => ({
  spaces: [{ id: "s1", name: "one" }, { id: "s2", name: "two" }],
  tabs: [{ id: "t1", space_id: "s1" }, { id: "t2", space_id: "s2" }],
  panes: [pane("1", "working", { unread: true }), pane("2", "blocked")],
  stopped: [], machines: [], policy_pending: [],
});

beforeEach(() => useStore.setState({ ...derive(EMPTY_RAW), raw: EMPTY_RAW, ui: { ...INITIAL_UI } }));

describe("setRaw", () => {
  it("keeps identity of unchanged panes and derived lists", () => {
    useStore.getState().setRaw(mkRaw());
    const a = useStore.getState();
    const next = mkRaw();
    next.panes![1] = pane("2", "done");
    a.setRaw(next);
    const b = useStore.getState();
    expect(b.paneById.get("1")).toBe(a.paneById.get("1"));
    expect(b.paneById.get("2")).not.toBe(a.paneById.get("2"));
    expect(b.tabs).toBe(a.tabs);
    expect(b.spaces).toBe(a.spaces);
    expect(b.tabById).toBe(a.tabById);
  });

  it("is a no-op for an identical state", () => {
    useStore.getState().setRaw(mkRaw());
    const a = useStore.getState();
    a.setRaw(mkRaw());
    expect(useStore.getState()).toBe(a);
  });

  it("counts states and unread", () => {
    useStore.getState().setRaw(mkRaw());
    expect(useStore.getState().counts).toMatchObject({ working: 1, blocked: 1, unread: 1, done: 0 });
  });

  it("merges machine snapshots", () => {
    const raw = mkRaw();
    raw.machines = [{ alias: "box", snapshot: { panes: [pane("box:9")], tabs: [{ id: "box:t", space_id: "box:s" }], spaces: [{ id: "box:s" }] } }];
    useStore.getState().setRaw(raw);
    const s = useStore.getState();
    expect(s.panes.map((p) => p.id)).toEqual(["1", "2", "box:9"]);
    expect(s.tabById.has("box:t")).toBe(true);
  });
});

describe("upsertPane", () => {
  it("replaces immutably and keeps the other panes", () => {
    useStore.getState().setRaw(mkRaw());
    const a = useStore.getState();
    a.upsertPane(pane("2", "done"));
    const b = useStore.getState();
    expect(b.raw.panes).not.toBe(a.raw.panes);
    expect(a.raw.panes![1].state).toBe("blocked");
    expect(b.paneById.get("2")!.state).toBe("done");
    expect(b.paneById.get("1")).toBe(a.paneById.get("1"));
  });

  it("appends a new pane and updates a machine pane", () => {
    const raw = mkRaw();
    raw.machines = [{ alias: "box", snapshot: { panes: [pane("box:9")] } }];
    useStore.getState().setRaw(raw);
    useStore.getState().upsertPane(pane("3"));
    useStore.getState().upsertPane(pane("box:9", "done"));
    const s = useStore.getState();
    expect(s.raw.panes!.map((p) => p.id)).toEqual(["1", "2", "3"]);
    expect(s.paneById.get("box:9")!.state).toBe("done");
  });
});

describe("fixSelection", () => {
  const d = derive(mkRaw());
  it("selects the first tab when nothing is selected", () => {
    expect(fixSelection(d, { tabId: null, spaceId: null })).toEqual({ tabId: "t1", spaceId: "s1" });
  });
  it("falls back to a tab in the same space, then keeps a valid tab", () => {
    expect(fixSelection(d, { tabId: "gone", spaceId: "s2" })).toEqual({ tabId: "t2", spaceId: "s2" });
    expect(fixSelection(d, { tabId: "t2", spaceId: "s1" })).toEqual({ tabId: "t2", spaceId: "s2" });
  });
  it("keeps a tab-less space, else first space, else null", () => {
    const noTabs = derive({ ...mkRaw(), tabs: [] });
    expect(fixSelection(noTabs, { tabId: null, spaceId: "s2" })).toEqual({ tabId: null, spaceId: "s2" });
    expect(fixSelection(noTabs, { tabId: null, spaceId: "x" })).toEqual({ tabId: null, spaceId: "s1" });
    expect(fixSelection(derive(EMPTY_RAW), { tabId: "t", spaceId: "s" })).toEqual({ tabId: null, spaceId: null });
  });
  it("is applied by setRaw", () => {
    useStore.getState().setRaw(mkRaw());
    expect(useStore.getState().ui).toMatchObject({ tabId: "t1", spaceId: "s1" });
  });
});
