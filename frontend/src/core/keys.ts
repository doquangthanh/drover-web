// Prefix-key shortcuts (default Ctrl+A, then a key). Everything else goes to the agent.
import { useStore } from "./store";

type ShortcutGroup = [string, [string, string, string][]];

export const SHORTCUTS: ShortcutGroup[] = [
  ["Agents", [["c", "New agent", "newAgent"], ["C", "New agent + worktree", "newAgentWorktree"],
    ["n", "Next that needs you", "nextBlocked"], ["N", "Next that's done", "nextDone"],
    ["a", "Answer prompt (then 1–3)", "answer"], ["e", "Send Esc", "sendEsc"],
    ["B", "Send to selected", "broadcast"], ["r", "Restart + resume", "restart"], ["o", "Agent tree", "tree"]]],
  ["Panes", [["%", "Split right", "splitRight"], ['"', "Split down", "splitDown"],
    ["ArrowLeft", "Focus left", "focusLeft"], ["ArrowRight", "Focus right", "focusRight"],
    ["ArrowUp", "Focus up", "focusUp"], ["ArrowDown", "Focus down", "focusDown"], [";", "Last pane", "lastPane"],
    ["Ctrl+Arrow", "Resize pane (Alt: bigger)", "resizePane"], ["{", "Swap with previous pane", "swapPrev"], ["}", "Swap with next pane", "swapNext"],
    ["z", "Zoom", "zoom"], ["[", "Find / scroll", "find"], [",", "Rename", "rename"], ["x", "Close pane", "closePane"]]],
  ["Tabs & spaces", [["t", "New tab", "newTab"], ["1", "Go to tab 1–9", "gotoTab"], ["Tab", "Next tab", "nextTab"],
    ["p", "Previous tab", "prevTab"], ["&", "Close tab", "closeCurrentTab"],
    ["s", "Switch space", "switchSpace"], ["S", "New space", "newSpace"], ["b", "Toggle sidebar", "toggleSidebar"]]],
  ["herd", [[":", "Command palette", "palette"], ["/", "Jump to a terminal", "search"], ["i", "Inbox", "inbox"],
    ["f", "Files", "files"], ["w", "Changes / worktrees", "changes"], ["m", "Machines", "machines"], [".", "Settings", "settings"],
    ["D", "Server", "server"], ["?", "This list", "help"]]],
];

const BY_KEY = new Map<string, string>();
for (const [, items] of SHORTCUTS) for (const [key, , action] of items) BY_KEY.set(key, action);
for (let i = 2; i <= 9; i++) BY_KEY.set(String(i), "gotoTab");

// Actions are filled in by the app shell (phase 4); keys and the event router call through this registry.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Actions = Record<string, (...args: any[]) => any>;
let actions: Actions = {};
let prefixKey = { ctrl: true, key: "a" };
let answerMode = false;

export function registerActions(map: Actions): void { actions = map; }
export function getActions(): Actions { return actions; }

export function setPrefix(spec: string | null | undefined): void {
  const m = /^C-(.)$/i.exec(spec || "C-a");
  prefixKey = { ctrl: true, key: (m ? m[1] : "a").toLowerCase() };
}

export function getPrefixKey(): string { return prefixKey.key; }

/** The slice of KeyboardEvent the handler needs (lets tests pass plain objects). */
export interface KeyLike {
  type: string; key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; preventDefault(): void;
}

/** VS Code style shortcuts: one chord, no prefix. [label shown in the sheet, chord, action] */
export const DIRECT_SHORTCUTS: [string, string, string][] = [
  ["Ctrl+Shift+P", "Command palette", "palette"], ["F1", "Command palette", "palette"], ["Ctrl+P", "Jump to a terminal", "search"],
  ["Ctrl+B", "Toggle sidebar", "toggleSidebar"], ["Ctrl+N", "New agent", "newAgent"], ["Ctrl+Shift+`", "New tab", "newTab"],
  ["Ctrl+\\", "Split right", "splitRight"], ["Ctrl+Shift+\\", "Split down", "splitDown"],
  ["F2", "Rename agent (sidebar: Delete closes)", "rename"], ["Ctrl+W", "Close tab", "closeCurrentTab"], ["Ctrl+Shift+W", "Close pane", "closePane"],
  ["Ctrl+Tab", "Next tab", "nextTab"], ["Ctrl+Shift+Tab", "Previous tab", "prevTab"], ["Ctrl+1–9", "Go to tab 1–9", "gotoTab"],
  ["Ctrl+Alt+←↑↓→", "Focus pane by direction", "focusLeft"], ["Ctrl+F", "Find in terminal", "find"],
  ["Ctrl+Shift+E", "Files", "files"], ["Ctrl+Shift+G", "Changes / worktrees", "changes"], ["Ctrl+Shift+I", "Inbox", "inbox"],
  ["Ctrl+Shift+M", "Machines", "machines"], ["Ctrl+Shift+A", "Agent tree", "tree"], ["Ctrl+,", "Settings", "settings"],
];

const DIRECT_CTRL: Record<string, string> = { p: "search", b: "toggleSidebar", n: "newAgent", w: "closeCurrentTab", f: "find", "\\": "splitRight", ",": "settings", PageDown: "nextTab", PageUp: "prevTab" };
const DIRECT_CTRL_SHIFT: Record<string, string> = { p: "palette", e: "files", g: "changes", i: "inbox", m: "machines", a: "tree", w: "closePane", "~": "newTab", "|": "splitDown", tab: "prevTab" };
const DIRECT_CTRL_ALT: Record<string, string> = { ArrowLeft: "focusLeft", ArrowRight: "focusRight", ArrowUp: "focusUp", ArrowDown: "focusDown" };

/** Action for a prefix-less VS Code chord, or undefined. */
export function directAction(ev: KeyLike): { action: string; key: string } | undefined {
  if (ev.key === "F1") return { action: "palette", key: ev.key };
  if (ev.key === "F2") return { action: "rename", key: ev.key };
  if (!ev.ctrlKey) return undefined;
  const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  if (ev.altKey) return DIRECT_CTRL_ALT[k] ? { action: DIRECT_CTRL_ALT[k], key: ev.key } : undefined;
  if (k === "Tab") return { action: ev.shiftKey ? "prevTab" : "nextTab", key: ev.key };
  if (/^[1-9]$/.test(k) && !ev.shiftKey) return { action: "gotoTab", key: k };
  const action = (ev.shiftKey ? DIRECT_CTRL_SHIFT : DIRECT_CTRL)[k];
  return action ? { action, key: ev.key } : undefined;
}

/** Action name a key triggers after the prefix, or undefined. */
export function actionForKey(key: string): string | undefined { return BY_KEY.get(key); }

const setPrefixUi = (on: boolean) => useStore.getState().setUi({ prefix: on });

/** Returns false when the key was consumed (xterm convention). */
export function handleKey(ev: KeyLike, paneId: string | null = null): boolean {
  if (ev.type !== "keydown") return true;
  if (useStore.getState().ui.prefix) {
    if (["Control", "Shift", "Alt", "Meta"].includes(ev.key)) return false;
    ev.preventDefault();
    setPrefixUi(false);
    if (ev.ctrlKey && ev.key.toLowerCase() === prefixKey.key && paneId) {
      actions.sendRaw?.(paneId, String.fromCharCode(prefixKey.key.charCodeAt(0) - 96));
      return false;
    }
    if ((ev.ctrlKey || ev.altKey) && ev.key.startsWith("Arrow")) { actions.resizePane?.({ key: ev.key, big: !!ev.altKey }); return false; }
    if (ev.key === "a") { answerMode = true; return false; }
    const action = BY_KEY.get(ev.key);
    if (action && actions[action]) actions[action]({ key: ev.key, paneId });
    return false;
  }
  if (answerMode) {
    answerMode = false;
    if (/^[1-9]$/.test(ev.key) && paneId) { ev.preventDefault(); actions.sendRaw?.(paneId, ev.key); return false; }
  }
  if (ev.ctrlKey && !ev.shiftKey && !ev.altKey && ev.key.toLowerCase() === prefixKey.key) {
    ev.preventDefault();
    setPrefixUi(true);
    return false;
  }
  const direct = directAction(ev); // the prefix key itself (checked above) always wins over a VS Code chord
  if (direct && actions[direct.action]) {
    ev.preventDefault();
    actions[direct.action]({ key: direct.key, paneId });
    return false;
  }
  return true;
}

/** Prefix also works when focus is outside a terminal (sidebar, views). Call once at startup. */
export function installGlobalKeys(): () => void {
  const onKey = (ev: KeyboardEvent) => {
    const t = ev.target as Element | null;
    if (t && t.closest && t.closest(".xterm")) return; // xterm calls handleKey itself
    const { ui } = useStore.getState();
    if (t && t.closest && t.closest(".ace_editor") && !ui.prefix) return; // the file editor keeps its own Ctrl+F / Ctrl+P / Ctrl+B ...
    const inField = !!t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || (t as HTMLElement).isContentEditable);
    if (inField && !ui.prefix && !ev.ctrlKey) return;
    // Ctrl+<prefix letter> in a text field keeps its editing meaning (Ctrl+A = select all) instead of arming the prefix
    if (inField && !ui.prefix && ev.ctrlKey && !ev.altKey && !ev.shiftKey && ev.key.toLowerCase() === prefixKey.key) return;
    if (handleKey(ev, ui.focusedPane || null) === false) ev.stopPropagation();
  };
  window.addEventListener("keydown", onKey, true);
  return () => window.removeEventListener("keydown", onKey, true);
}
