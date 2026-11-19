// VS Code style shortcuts: one chord (Ctrl+P) or a Ctrl+K two-step chord (Ctrl+K W). Everything else goes to the agent.
import { useStore } from "./store";

/** [group, [[keys as shown, label, action]]]: the shortcuts sheet and the palette read this. */
export type ShortcutGroup = [string, [string, string, string][]];

export const SHORTCUTS: ShortcutGroup[] = [
  ["General", [["Ctrl+Shift+P", "Command palette", "palette"], ["F1", "Command palette", "palette"],
    ["Ctrl+P", "Jump to a terminal", "search"], ["Ctrl+B", "Toggle sidebar", "toggleSidebar"],
    ["Ctrl+,", "Settings", "settings"], ["Ctrl+K Ctrl+S", "Keyboard shortcuts", "help"]]],
  ["Terminals & tabs", [["Ctrl+Shift+`", "New terminal", "newAgent"], ["Ctrl+N", "New tab", "newTab"],
    ["Ctrl+W", "Close tab", "closeCurrentTab"], ["Ctrl+Tab", "Next tab", "nextTab"], ["Ctrl+Shift+Tab", "Previous tab", "prevTab"],
    ["Ctrl+PageDown", "Next tab", "nextTab"], ["Ctrl+PageUp", "Previous tab", "prevTab"], ["Alt+1–9", "Go to tab 1–9", "gotoTab"],
    ["F2", "Rename", "rename"], ["Ctrl+F", "Find in terminal", "find"]]],
  ["Panes", [["Ctrl+\\", "Split right", "splitRight"], ["Ctrl+Shift+5", "Split right", "splitRight"],
    ["Ctrl+K Ctrl+\\", "Split down", "splitDown"], ["Ctrl+K W", "Close pane", "closePane"],
    ["Ctrl+1–9", "Focus pane 1–9", "gotoPane"], ["Ctrl+K Ctrl+←↑↓→", "Focus pane by direction", "focusLeft"],
    ["Ctrl+K ←→", "Swap with previous / next pane", "swapPrev"], ["Ctrl+K Shift+←↑↓→", "Resize pane (Alt: bigger)", "resizePane"],
    ["Ctrl+K Ctrl+M", "Zoom pane", "zoom"]]],
  ["Views & agents", [["Ctrl+Shift+E", "Files", "files"], ["Ctrl+Shift+G", "Changes / worktrees", "changes"],
    ["Ctrl+Shift+I", "Inbox", "inbox"], ["Ctrl+Shift+M", "Machines", "machines"], ["Ctrl+Shift+A", "Agent tree", "tree"],
    ["F8", "Next agent that needs you", "nextBlocked"], ["Shift+F8", "Next finished agent", "nextDone"]]],
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Actions = Record<string, (...args: any[]) => any>;
let actions: Actions = {};

export function registerActions(map: Actions): void { actions = map; }
export function getActions(): Actions { return actions; }

/** The slice of KeyboardEvent the handler needs (lets tests pass plain objects). */
export interface KeyLike {
  type: string; key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; preventDefault(): void;
}

const CTRL: Record<string, string> = { p: "search", b: "toggleSidebar", n: "newTab", w: "closeCurrentTab", f: "find", "\\": "splitRight", ",": "settings", PageDown: "nextTab", PageUp: "prevTab" };
// Shift changes ev.key on a US layout: ` -> ~, 5 -> %, \ -> |
const CTRL_SHIFT: Record<string, string> = { p: "palette", e: "files", g: "changes", i: "inbox", m: "machines", a: "tree", "~": "newAgent", "`": "newAgent", "%": "splitRight", "5": "splitRight" };
const FOCUS: Record<string, string> = { ArrowLeft: "focusLeft", ArrowRight: "focusRight", ArrowUp: "focusUp", ArrowDown: "focusDown" };
const ARROWS = Object.keys(FOCUS);

const norm = (key: string) => (key.length === 1 ? key.toLowerCase() : key);

/** Action for a one-step chord, or undefined. `key` is what the action receives. */
export function directAction(ev: KeyLike): { action: string; key: string } | undefined {
  if (ev.key === "F1") return { action: "palette", key: ev.key };
  if (ev.key === "F2") return { action: "rename", key: ev.key };
  if (ev.key === "F8") return { action: ev.shiftKey ? "nextDone" : "nextBlocked", key: ev.key };
  if (ev.altKey && !ev.ctrlKey && !ev.shiftKey && /^[1-9]$/.test(ev.key)) return { action: "gotoTab", key: ev.key };
  if (!ev.ctrlKey || ev.altKey) return undefined;
  const k = norm(ev.key);
  if (k === "Tab") return { action: ev.shiftKey ? "prevTab" : "nextTab", key: ev.key };
  if (/^[1-9]$/.test(k) && !ev.shiftKey) return { action: "gotoPane", key: k };
  const action = (ev.shiftKey ? CTRL_SHIFT : CTRL)[k];
  return action ? { action, key: ev.key } : undefined;
}

/** Action for the second step of a Ctrl+K chord, or undefined. */
export function chordAction(ev: KeyLike): { action: string; key: string; big?: boolean } | undefined {
  const k = norm(ev.key);
  if (ARROWS.includes(k)) {
    if (ev.shiftKey) return { action: "resizePane", key: k, big: !!ev.altKey };
    if (ev.ctrlKey) return { action: FOCUS[k], key: k };
    if (k === "ArrowLeft") return { action: "swapPrev", key: k };
    if (k === "ArrowRight") return { action: "swapNext", key: k };
    return undefined;
  }
  if (ev.ctrlKey && k === "\\") return { action: "splitDown", key: k };
  if (ev.ctrlKey && k === "s") return { action: "help", key: k };
  if (ev.ctrlKey && k === "m") return { action: "zoom", key: k };
  if (!ev.ctrlKey && k === "w") return { action: "closePane", key: k };
  return undefined;
}

const chordPending = () => useStore.getState().ui.prefix;
const setChord = (on: boolean) => useStore.getState().setUi({ prefix: on });

/** Returns false when the key was consumed (xterm convention). */
export function handleKey(ev: KeyLike, paneId: string | null = null): boolean {
  if (ev.type !== "keydown") return true;
  if (chordPending()) {
    if (["Control", "Shift", "Alt", "Meta"].includes(ev.key)) return false;
    ev.preventDefault();
    setChord(false);
    const hit = chordAction(ev);
    if (hit && actions[hit.action]) actions[hit.action]({ key: hit.key, big: hit.big, paneId });
    return false; // an unknown second key is dropped, as in VS Code
  }
  if (ev.ctrlKey && !ev.shiftKey && !ev.altKey && norm(ev.key) === "k") {
    ev.preventDefault();
    setChord(true);
    return false;
  }
  const direct = directAction(ev);
  if (direct && actions[direct.action]) {
    ev.preventDefault();
    actions[direct.action]({ key: direct.key, paneId });
    return false;
  }
  return true;
}

/** Shortcuts also work when focus is outside a terminal (sidebar, views). Call once at startup. */
export function installGlobalKeys(): () => void {
  const onKey = (ev: KeyboardEvent) => {
    const t = ev.target as Element | null;
    if (t && t.closest && t.closest(".xterm")) return; // xterm calls handleKey itself
    const { ui } = useStore.getState();
    if (t && t.closest && t.closest(".ace_editor") && !ui.prefix) return; // the file editor keeps its own Ctrl+F / Ctrl+P / Ctrl+B ...
    const inField = !!t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || (t as HTMLElement).isContentEditable);
    if (inField && !ui.prefix && !ev.ctrlKey && !/^F\d$/.test(ev.key)) return;
    if (handleKey(ev, ui.focusedPane || null) === false) ev.stopPropagation();
  };
  window.addEventListener("keydown", onKey, true);
  return () => window.removeEventListener("keydown", onKey, true);
}
