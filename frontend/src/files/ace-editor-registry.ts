// Code editor (Ace). One editor instance for the whole app; every open file keeps its own session, so switching
// files or views keeps undo history, cursor and unsaved edits. Plain module: nothing here lives in React state.
import { activeTheme, onThemeChange } from "../core/theme";
import type { AceEditor, AceSession } from "./ace";
import type { DiffMarks } from "./diff-marks";
import { aceThemeFor, modeFor } from "./editor-modes";
import { loadAce } from "./load-ace-script";

export interface EditorDoc { session: AceSession; mtime: number; path: string; editable: boolean }
interface Shared { el: HTMLDivElement; editor: AceEditor }

let shared: Shared | null = null;
let creating: Promise<Shared> | null = null;
let saveHandler: (() => void) | null = null;
const sessions = new Map<string, EditorDoc>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

/** Runs after every edit in any document (cheap: subscribers compare a snapshot string). */
export function subscribeDocs(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }

/** Ctrl/Cmd+S inside the editor calls the latest handler. */
export function setSaveHandler(fn: (() => void) | null): void { saveHandler = fn; }

/** Alt+S inside the editor: send the selection to an agent. */
let sendHandler: (() => void) | null = null;
export function setSendHandler(fn: (() => void) | null): void { sendHandler = fn; }

/** What is selected in the editor now: text and 1-based line range (the cursor line when nothing is selected). */
export function getSelection(): { text: string; startLine: number; endLine: number } | null {
  if (!shared) return null;
  const r = shared.editor.getSelectionRange();
  // A selection that ends at column 0 of the next row does not include that row.
  const endRow = r.end.column === 0 && r.end.row > r.start.row ? r.end.row - 1 : r.end.row;
  return { text: shared.editor.getSelectedText(), startLine: r.start.row + 1, endLine: endRow + 1 };
}

/** Lazily loads Ace and creates the one shared editor. */
export function getEditor(): Promise<Shared> {
  if (shared) return Promise.resolve(shared);
  creating ??= loadAce().then((ace) => {
    const el = document.createElement("div");
    el.className = "fcode";
    ace.config.set("basePath", "/static/vendor/ace");
    const editor = ace.edit(el, {
      fontFamily: '"JetBrains Mono", ui-monospace, Consolas, monospace', fontSize: 13, showPrintMargin: false,
      scrollPastEnd: 0.25, highlightActiveLine: true, tabSize: 4, useSoftTabs: true,
    });
    editor.renderer.setScrollMargin(6, 0);
    const applyTheme = () => editor.setTheme(aceThemeFor(activeTheme()));
    applyTheme();
    onThemeChange(applyTheme);
    editor.commands.addCommand({ name: "droverSave", bindKey: { win: "Ctrl-S", mac: "Command-S" }, exec: () => saveHandler?.() });
    editor.commands.addCommand({ name: "droverSend", bindKey: { win: "Alt-S", mac: "Alt-S" }, exec: () => sendHandler?.() });
    shared = { el, editor };
    return shared;
  }).catch((e) => { creating = null; throw e; });
  return creating;
}

/** Open (or switch to) a document. An existing session keeps its unsaved edits. */
export function openDoc(editor: AceEditor, key: string, path: string, text: string, mtime: number, editable: boolean): EditorDoc {
  let doc = sessions.get(key);
  if (!doc) {
    const session = window.ace!.createEditSession(text, `ace/mode/${modeFor(path)}`);
    session.setUseWorker(false); // no lint workers: keeps it offline and light
    session.setNewLineMode("auto"); // keep the file's own CRLF / LF when saving
    session.getUndoManager().markClean();
    session.on("change", notify);
    doc = { session, mtime, path, editable };
    sessions.set(key, doc);
    paintMarks(key);
  }
  doc.editable = editable;
  editor.setSession(doc.session);
  editor.setReadOnly(!editable);
  shownKey = key;
  return doc;
}

// "Open this file at line N" (a Ctrl+Click on a path in a terminal): applied as soon as that document is showing.
let shownKey: string | null = null;
let pendingGoto: { key: string; line: number; col: number } | null = null;

export function requestGoto(key: string, line: number, col = 1): void {
  pendingGoto = { key, line, col };
  if (shared && shownKey === key) applyGoto(shared.editor, key);
}

/** Moves the cursor if a jump is waiting for this document. Call after openDoc. */
export function applyGoto(editor: AceEditor, key: string): void {
  if (!pendingGoto || pendingGoto.key !== key) return;
  const { line, col } = pendingGoto;
  pendingGoto = null;
  editor.gotoLine(line, Math.max(0, col - 1), true);
  editor.focus();
}

// Git marks in the gutter (green added, orange changed, red removed-here), from the file's diff against HEAD.
const docMarks = new Map<string, DiffMarks>();
const painted = new Map<string, { row: number; cls: string }[]>();

function paintMarks(key: string): void {
  const doc = sessions.get(key);
  if (!doc) return;
  for (const m of painted.get(key) ?? []) doc.session.removeGutterDecoration(m.row, m.cls);
  const marks = docMarks.get(key);
  const next = marks ? [
    ...marks.added.map((l) => ({ row: l - 1, cls: "drv-add" })),
    ...marks.modified.map((l) => ({ row: l - 1, cls: "drv-mod" })),
    ...marks.deleted.map((l) => ({ row: l - 1, cls: "drv-del" })),
  ] : [];
  for (const m of next) doc.session.addGutterDecoration(m.row, m.cls);
  painted.set(key, next);
}

/** Set (or clear, with null) the gutter marks of a document; painted now or when its session is created. */
export function setDocMarks(key: string, marks: DiffMarks | null): void {
  if (marks) docMarks.set(key, marks); else docMarks.delete(key);
  paintMarks(key);
}

/** Forget a document (its tab was closed); unsaved edits are gone. */
export function dropDoc(key: string): void {
  sessions.delete(key);
  docMarks.delete(key);
  painted.delete(key);
  if (shownKey === key) shownKey = null;
  notify();
}

export const getDoc = (key: string): EditorDoc | undefined => sessions.get(key);
export const isDirty = (key: string): boolean => { const d = sessions.get(key); return !!d && !d.session.getUndoManager().isClean(); };
const dirtyKeys = (): string[] => [...sessions.keys()].filter(isDirty);
/** Stable string for useSyncExternalStore: changes only when the set of dirty documents changes. */
export const dirtySignature = (): string => dirtyKeys().join("\n");
export const isDirtyIn = (signature: string, key: string): boolean => signature.split("\n").includes(key);

/** Replace a clean document's text with what is on disk now (keeps the scroll position). */
export function reloadDoc(key: string, text: string, mtime: number): void {
  const doc = sessions.get(key);
  if (!doc) return;
  const top = doc.session.getScrollTop();
  doc.session.setValue(text);
  doc.session.getUndoManager().reset();
  doc.session.getUndoManager().markClean();
  doc.session.setScrollTop(top);
  doc.mtime = mtime;
  notify();
}

export function markSaved(key: string, mtime: number): void {
  const doc = sessions.get(key);
  if (!doc) return;
  doc.mtime = mtime;
  doc.session.getUndoManager().markClean();
  notify();
}

/** Call after the editor element was attached or resized. */
export function layout(): void { requestAnimationFrame(() => shared?.editor.resize(true)); }

window.addEventListener("beforeunload", (e) => { if (dirtyKeys().length) { e.preventDefault(); e.returnValue = ""; } });
