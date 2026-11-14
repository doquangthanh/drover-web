import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHORTCUTS, actionForKey, handleKey, registerActions, setPrefix, type KeyLike } from "./keys";
import { INITIAL_UI, useStore } from "./store";

const ev = (key: string, extra: Partial<KeyLike> = {}): KeyLike => ({ type: "keydown", key, preventDefault: vi.fn(), ...extra });
const prefixOn = () => useStore.getState().ui.prefix;

beforeEach(() => {
  useStore.setState({ ui: { ...INITIAL_UI } });
  setPrefix("C-b");
  registerActions({});
});

describe("key map", () => {
  it("maps every shortcut and tabs 2-9", () => {
    for (const [, items] of SHORTCUTS) for (const [key, , action] of items) expect(actionForKey(key)).toBe(action);
    expect(actionForKey("5")).toBe("gotoTab");
    expect(actionForKey("q")).toBeUndefined();
  });
});

describe("handleKey", () => {
  it("passes ordinary keys and non-keydown through", () => {
    expect(handleKey(ev("a"))).toBe(true);
    expect(handleKey({ ...ev("b", { ctrlKey: true }), type: "keyup" })).toBe(true);
  });

  it("Ctrl+B arms the prefix, next key runs the action", () => {
    const run = vi.fn();
    registerActions({ newTab: run });
    const arm = ev("b", { ctrlKey: true });
    expect(handleKey(arm, "p1")).toBe(false);
    expect(arm.preventDefault).toHaveBeenCalled();
    expect(prefixOn()).toBe(true);
    expect(handleKey(ev("t"), "p1")).toBe(false);
    expect(prefixOn()).toBe(false);
    expect(run).toHaveBeenCalledWith({ key: "t", paneId: "p1" });
  });

  it("ignores bare modifiers while armed", () => {
    handleKey(ev("b", { ctrlKey: true }));
    expect(handleKey(ev("Shift"))).toBe(false);
    expect(prefixOn()).toBe(true);
  });

  it("double prefix sends the raw control char to the pane", () => {
    const sendRaw = vi.fn();
    registerActions({ sendRaw });
    handleKey(ev("b", { ctrlKey: true }), "p1");
    handleKey(ev("b", { ctrlKey: true }), "p1");
    expect(sendRaw).toHaveBeenCalledWith("p1", "\x02");
  });

  it("answer mode: prefix a then digit sends it to the pane", () => {
    const sendRaw = vi.fn();
    registerActions({ sendRaw });
    handleKey(ev("b", { ctrlKey: true }), "p1");
    handleKey(ev("a"), "p1");
    expect(handleKey(ev("2"), "p1")).toBe(false);
    expect(sendRaw).toHaveBeenCalledWith("p1", "2");
    expect(handleKey(ev("2"), "p1")).toBe(true); // answer mode is one-shot
  });

  it("honours a custom prefix", () => {
    setPrefix("C-a");
    expect(handleKey(ev("b", { ctrlKey: true }))).toBe(true);
    expect(handleKey(ev("a", { ctrlKey: true }))).toBe(false);
    expect(prefixOn()).toBe(true);
  });
});
