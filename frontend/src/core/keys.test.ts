import { beforeEach, describe, expect, it, vi } from "vitest";
import { chordAction, directAction, handleKey, programKeeps, registerActions, type KeyLike } from "./keys";
import { INITIAL_UI, useStore } from "./store";

const ev = (key: string, extra: Partial<KeyLike> = {}): KeyLike => ({ type: "keydown", key, preventDefault: vi.fn(), ...extra });
const chordOn = () => useStore.getState().ui.prefix;

beforeEach(() => {
  useStore.setState({ ui: { ...INITIAL_UI } });
  registerActions({});
});

describe("VS Code one-step chords", () => {
  const act = (key: string, extra: Partial<KeyLike> = {}) => directAction(ev(key, { ctrlKey: true, ...extra }))?.action;

  it("maps the VS Code defaults", () => {
    expect(act("p", { shiftKey: true })).toBe("palette");
    expect(act("P", { shiftKey: true })).toBe("palette");
    expect(act("p")).toBe("search");
    expect(act("b")).toBe("toggleSidebar");
    expect(act("n")).toBe("newTab");
    expect(act("~", { shiftKey: true })).toBe("newAgent");
    expect(act("w")).toBe("closeCurrentTab");
    expect(act("\\")).toBe("splitRight");
    expect(act("%", { shiftKey: true })).toBe("splitRight");
    expect(act("f")).toBe("find");
    expect(act(",")).toBe("settings");
    expect(act("e", { shiftKey: true })).toBe("files");
    expect(act("g", { shiftKey: true })).toBe("changes");
    expect(act("Tab")).toBe("nextTab");
    expect(act("Tab", { shiftKey: true })).toBe("prevTab");
    expect(act("PageDown")).toBe("nextTab");
    expect(act("PageUp")).toBe("prevTab");
  });

  it("Ctrl+1–9 focuses a pane, Alt+1–9 goes to a tab", () => {
    expect(directAction(ev("3", { ctrlKey: true }))).toEqual({ action: "gotoPane", key: "3" });
    expect(directAction(ev("4", { altKey: true }))).toEqual({ action: "gotoTab", key: "4" });
  });

  it("function keys need no modifier", () => {
    expect(directAction(ev("F1"))?.action).toBe("palette");
    expect(directAction(ev("F2"))?.action).toBe("rename");
    expect(directAction(ev("F8"))?.action).toBe("nextBlocked");
    expect(directAction(ev("F8", { shiftKey: true }))?.action).toBe("nextDone");
  });

  it("leaves plain keys and Ctrl+A / Ctrl+C / Ctrl+Shift+W to the agent", () => {
    expect(directAction(ev("p"))).toBeUndefined();
    expect(act("a")).toBeUndefined();
    expect(act("c")).toBeUndefined();
    expect(act("w", { shiftKey: true })).toBeUndefined();
  });
});

describe("Ctrl+K two-step chords", () => {
  const second = (key: string, extra: Partial<KeyLike> = {}) => chordAction(ev(key, extra))?.action;

  it("maps the second key", () => {
    expect(second("\\", { ctrlKey: true })).toBe("splitDown");
    expect(second("w")).toBe("closePane");
    expect(second("W")).toBe("closePane");
    expect(second("s", { ctrlKey: true })).toBe("help");
    expect(second("m", { ctrlKey: true })).toBe("zoom");
    expect(second("ArrowLeft", { ctrlKey: true })).toBe("focusLeft");
    expect(second("ArrowDown", { ctrlKey: true })).toBe("focusDown");
    expect(second("ArrowLeft")).toBe("swapPrev");
    expect(second("ArrowRight")).toBe("swapNext");
    expect(chordAction(ev("ArrowUp", { shiftKey: true, altKey: true }))).toEqual({ action: "resizePane", key: "ArrowUp", big: true });
    expect(second("q")).toBeUndefined();
  });

  it("Ctrl+K arms the chord, the next key runs the action and disarms it", () => {
    const closePane = vi.fn();
    registerActions({ closePane });
    expect(handleKey(ev("k", { ctrlKey: true }), "%1")).toBe(false);
    expect(chordOn()).toBe(true);
    expect(handleKey(ev("Control"))).toBe(false); // modifiers alone keep waiting
    expect(chordOn()).toBe(true);
    expect(handleKey(ev("w"), "%1")).toBe(false);
    expect(closePane).toHaveBeenCalledWith({ key: "w", big: undefined, paneId: "%1" });
    expect(chordOn()).toBe(false);
  });

  it("an unknown second key is swallowed, not sent to the agent", () => {
    handleKey(ev("k", { ctrlKey: true }));
    expect(handleKey(ev("q"))).toBe(false);
    expect(chordOn()).toBe(false);
  });
});

describe("handleKey", () => {
  it("passes ordinary keys and non-keydown through", () => {
    expect(handleKey(ev("a"))).toBe(true);
    expect(handleKey(ev("a", { ctrlKey: true }))).toBe(true);
    expect(handleKey({ ...ev("b", { ctrlKey: true }), type: "keyup" })).toBe(true);
  });

  it("runs a one-step chord and consumes it", () => {
    const run = vi.fn();
    registerActions({ toggleSidebar: run });
    const e = ev("b", { ctrlKey: true });
    expect(handleKey(e, "%2")).toBe(false);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(run).toHaveBeenCalledWith({ key: "b", paneId: "%2" });
  });

  it("a chord with no registered action goes to the agent", () => {
    expect(handleKey(ev("b", { ctrlKey: true }))).toBe(true);
  });
});

describe("programKeeps", () => {
  beforeEach(() => useStore.setState({ ui: { ...INITIAL_UI } }));
  it("leaves Ctrl+J (dock toggle) to the terminal program, a newline for shells and agents", () => {
    expect(programKeeps(ev("j", { ctrlKey: true }))).toBe(true);
    expect(programKeeps(ev("p", { ctrlKey: true }))).toBe(false);
    expect(programKeeps({ ...ev("j", { ctrlKey: true }), type: "keyup" })).toBe(false);
  });
});
