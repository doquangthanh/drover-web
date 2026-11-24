// VS Code style shortcuts: one chord (Ctrl+P) or a Ctrl+K two-step chord (Ctrl+K W). Everything else goes to the agent.
import { NO_WEB_KEYS, chordOfEvent, customKeysFor, normalizeChord, type WebKeys } from "./keybindings";
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
  // Handled inside the file editor / terminal links, not by directAction (the editor keeps its own keys).
  ["Code", [["Ctrl+Click", "Open a file path from a terminal", "openPath"], ["Ctrl+S", "Save the open file", "save"],
    ["Alt+S", "Send the editor selection to an agent", "sendSelection"], ["Ctrl+J", "Show / hide the agent beside the editor", "toggleDock"],
    ["F7", "Review: next hunk (Shift+F7 previous)", "nextHunk"], ["A", "Review: mark the hunk reviewed, go to the next", "reviewHunk"],
    ["?", "This list (outside terminals and fields)", "help"]]],
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

const CTRL: Record<string, string> = { j: "toggleDock", p: "search", b: "toggleSidebar", n: "newTab", w: "closeCurrentTab", f: "find", "\\": "splitRight", ",": "settings", PageDown: "nextTab", PageUp: "prevTab" };
// Shift changes ev.key on a US layout: ` -> ~, 5 -> %, \ -> |
const CTRL_SHIFT: Record<string, string> = { p: "palette", e: "files", g: "changes", i: "inbox", m: "machines", a: "tree", "~": "newAgent", "`": "newAgent", "%": "splitRight", "5": "splitRight" };
const FOCUS: Record<string, string> = { ArrowLeft: "focusLeft", ArrowRight: "focusRight", ArrowUp: "focusUp", ArrowDown: "focusDown" };
const ARROWS = Object.keys(FOCUS);

const norm = (key: string) => (key.length === 1 ? key.toLowerCase() : key);

let webKeys: WebKeys = NO_WEB_KEYS;
/** The `[web_keys]` of keys.toml (see keybindings.ts). */
export function setWebKeys(wk: WebKeys): void { webKeys = wk; keysListeners.forEach((fn) => fn()); }
export function getWebKeys(): WebKeys { return webKeys; }

const keysListeners = new Set<() => void>();
/** Runs when the custom keys change (the shortcut sheet and the palette re-read them). Returns an unsubscribe. */
export function onWebKeysChange(fn: () => void): () => void { keysListeners.add(fn); return () => { keysListeners.delete(fn); }; }

/** What to print next to an action: its custom chord if it has one, else the built-in text from the sheet. */
export function keysFor(action: string, builtin: string): string { return customKeysFor(webKeys, action) ?? builtin; }

/** Single-step built-in chords of the sheet, normalized: chord -> action. */
export function builtinChords(): Map<string, string> {
  const m = new Map<string, string>();
  for (const [, items] of SHORTCUTS) for (const [keys, , action] of items) {
    if (keys.includes(" ")) continue; // two-step chords start with Ctrl+K
    const chord = normalizeChord(keys);
    if (chord && !m.has(chord)) m.set(chord, action);
  }
  return m;
}

/** Action for a one-step chord, or undefined: a custom chord first; a built-in chord of an action that has a custom
 * one is switched off. `key` is what the action receives. */
export function directAction(ev: KeyLike & { metaKey?: boolean }): { action: string; key: string } | undefined {
  if (webKeys.byChord.size) {
    const custom = webKeys.byChord.get(chordOfEvent(ev));
    if (custom) return { action: custom, key: ev.key };
  }
  const hit = builtinAction(ev);
  return hit && webKeys.overridden.has(hit.action) ? undefined : hit;
}

function builtinAction(ev: KeyLike): { action: string; key: string } | undefined {
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

/** Actions whose chord the focused program keeps: Ctrl+J is a newline in shells and agent prompts. */
const PROGRAM_KEEPS = new Set(["toggleDock"]);
/** True when a terminal (or the editor) should get this key itself instead of running its shortcut. */
export function programKeeps(ev: KeyLike & { metaKey?: boolean }): boolean {
  if (ev.type !== "keydown" || chordPending()) return false;
  const hit = directAction(ev);
  return !!hit && PROGRAM_KEEPS.has(hit.action);
}

/** Shortcuts also work when focus is outside a terminal (sidebar, views). Call once at startup. */
export function installGlobalKeys(): () => void {
  const onKey = (ev: KeyboardEvent) => {
    const t = ev.target as Element | null;
    if (t && t.closest && t.closest(".xterm")) return; // xterm calls handleKey itself
    const { ui } = useStore.getState();
    // The file editor keeps its own Ctrl+F / Ctrl+P / Ctrl+B ..., but the agent dock toggle works from it too.
    if (t && t.closest && t.closest(".ace_editor") && !ui.prefix && directAction(ev)?.action !== "toggleDock") return;
    const inField = !!t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || (t as HTMLElement).isContentEditable);
    if (inField && !ui.prefix && !ev.ctrlKey && !/^F\d$/.test(ev.key)) return;
    if (!inField && !ui.prefix && ev.key === "?" && !ev.ctrlKey && !ev.altKey && actions.help) { ev.preventDefault(); actions.help(); return; }
    if (handleKey(ev, ui.focusedPane || null) === false) ev.stopPropagation();
  };
  window.addEventListener("keydown", onKey, true);
  return () => window.removeEventListener("keydown", onKey, true);
}
