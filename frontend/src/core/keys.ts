// Prefix-key shortcuts (default Ctrl+B, then a key). Everything else goes to the agent.
import { useStore } from "./store";

type ShortcutGroup = [string, [string, string, string][]];

export const SHORTCUTS: ShortcutGroup[] = [
  ["Agents", [["c", "New agent", "newAgent"], ["C", "New agent + worktree", "newAgentWorktree"],
    ["n", "Next that needs you", "nextBlocked"], ["N", "Next that's done", "nextDone"],
    ["a", "Answer prompt (then 1–3)", "answer"], ["e", "Send Esc", "sendEsc"],
    ["B", "Send to selected", "broadcast"], ["r", "Restart + resume", "restart"], ["o", "Agent tree", "tree"]]],
  ["Panes", [["%", "Split right", "splitRight"], ['"', "Split down", "splitDown"],
    ["ArrowLeft", "Focus left", "focusPrev"], ["ArrowRight", "Focus right", "focusNext"],
    ["z", "Zoom", "zoom"], ["[", "Find / scroll", "find"], [",", "Rename", "rename"], ["x", "Close pane", "closePane"]]],
  ["Tabs & spaces", [["t", "New tab", "newTab"], ["1", "Go to tab 1–9", "gotoTab"], ["Tab", "Next tab", "nextTab"],
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
let prefixKey = { ctrl: true, key: "b" };
let answerMode = false;

export function registerActions(map: Actions): void { actions = map; }
export function getActions(): Actions { return actions; }

export function setPrefix(spec: string | null | undefined): void {
  const m = /^C-(.)$/i.exec(spec || "C-b");
  prefixKey = { ctrl: true, key: (m ? m[1] : "b").toLowerCase() };
}

export function getPrefixKey(): string { return prefixKey.key; }

/** The slice of KeyboardEvent the handler needs (lets tests pass plain objects). */
export interface KeyLike {
  type: string; key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; preventDefault(): void;
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
  return true;
}

/** Prefix also works when focus is outside a terminal (sidebar, views). Call once at startup. */
export function installGlobalKeys(): () => void {
  const onKey = (ev: KeyboardEvent) => {
    const t = ev.target as Element | null;
    if (t && t.closest && t.closest(".xterm")) return; // xterm calls handleKey itself
    const { ui } = useStore.getState();
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !ui.prefix && !ev.ctrlKey) return;
    if (handleKey(ev, ui.focusedPane || null) === false) ev.stopPropagation();
  };
  window.addEventListener("keydown", onKey, true);
  return () => window.removeEventListener("keydown", onKey, true);
}
