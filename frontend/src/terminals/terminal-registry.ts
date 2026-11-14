// One xterm.js instance per pane, kept alive across React renders (the element is moved, not rebuilt).
// Output path: conn output handler -> term.write. Input path: term.onData -> conn.input. No React state involved.
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal } from "@xterm/xterm";
import { conn } from "../core/connection";
import { handleKey } from "../core/keys";
import { useStore } from "../core/store";
import { onThemeChange, termOptions, termTheme } from "../core/theme";
import { isPhone } from "../core/viewport";
import { FONT, scheduleFit } from "./terminal-fit";
import type { TermEntry } from "./terminal-entry";

const terms = new Map<string, TermEntry>();
onThemeChange(() => { for (const { term } of terms.values()) term.options.theme = termTheme(); });

/** Idempotent: returns the existing entry (StrictMode double mounts, re-parenting). */
export function getTerminal(paneId: string): TermEntry {
  const existing = terms.get(paneId);
  if (existing) return existing;
  const el = document.createElement("div");
  el.className = "term";
  const term = new Terminal({
    fontFamily: FONT, fontSize: isPhone() ? 12 : 13, lineHeight: 1.15,
    ...termOptions(), scrollback: 5000, allowProposedApi: true, macOptionIsMeta: true,
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  try { term.loadAddon(new WebLinksAddon()); } catch { /* optional */ }
  const entry: TermEntry = {
    paneId, el, term, fit, opened: false, lastSize: "", resizeTimer: undefined, refocus: false, wantFocus: false,
    findIndex: 0, findQuery: "", observer: new ResizeObserver(() => scheduleFit(entry)),
  };
  // xterm answers the shell's "who are you" query (Device Attributes) and ConPTY hands that answer to PowerShell as
  // typed text ("[?1;2c" on the prompt). The shell never needs it, so it is dropped.
  term.onData((data) => { if (!/^\x1b\[[?>][\d;]*c$/.test(data)) conn.input(paneId, data); });
  term.attachCustomKeyEventHandler((ev) => handleKey(ev, paneId));
  conn.attach(paneId, (data, isReplay) => {
    if (isReplay) term.reset();
    term.write(data);
  });
  entry.observer.observe(el);
  terms.set(paneId, entry);
  return entry;
}

export function focusTerminal(paneId: string | null): void {
  const entry = paneId ? terms.get(paneId) : undefined;
  if (!entry) return;
  if (entry.opened) entry.term.focus(); else entry.wantFocus = true;
}

export function disposeMissing(liveIds: Set<string>): void {
  for (const [id, entry] of terms) {
    if (liveIds.has(id)) continue;
    conn.detach(id);
    entry.observer.disconnect();
    clearTimeout(entry.resizeTimer);
    entry.term.dispose();
    entry.el.remove();
    terms.delete(id);
  }
}

let watching = false;
/** Dispose terminals of panes that are gone. Driven by the pane list changing, not by rendering. */
export function watchPaneIds(): void {
  if (watching) return;
  watching = true;
  useStore.subscribe((s, prev) => {
    if (s.panes === prev.panes) return;
    disposeMissing(new Set(s.panes.map((p) => p.id)));
  });
}

export function sendToPane(paneId: string, data: string): void { conn.input(paneId, data); }

/** Find text in the scrollback; selects and scrolls to the match. Returns {index, total}. */
export function findInPane(paneId: string, query: string, fromEnd = true, step = 0): { index: number; total: number } {
  const entry = terms.get(paneId);
  if (!entry || !query) return { index: 0, total: 0 };
  const buf = entry.term.buffer.active;
  const q = query.toLowerCase();
  const hits: [number, number][] = [];
  for (let y = 0; y < buf.length; y++) {
    const line = (buf.getLine(y)?.translateToString(true) || "").toLowerCase();
    let x = line.indexOf(q);
    while (x >= 0) { hits.push([x, y]); x = line.indexOf(q, x + 1); }
  }
  if (!hits.length) { entry.term.clearSelection(); return { index: 0, total: 0 }; }
  entry.findIndex = entry.findQuery === query ? (entry.findIndex + step + hits.length) % hits.length
    : (fromEnd ? hits.length - 1 : 0);
  entry.findQuery = query;
  const [x, y] = hits[entry.findIndex];
  entry.term.select(x, y, query.length);
  entry.term.scrollToLine(Math.max(0, y - Math.floor(entry.term.rows / 2)));
  return { index: entry.findIndex + 1, total: hits.length };
}

export function scrollbackDepth(paneId: string): string {
  const t = terms.get(paneId)?.term;
  if (!t) return "";
  const fr = (n: number) => n.toLocaleString("fr-FR");
  return `scrollback ${fr(t.buffer.active.length)} / ${fr(t.options.scrollback ?? 0)}`;
}

export function copySelection(paneId: string): boolean {
  const text = terms.get(paneId)?.term.getSelection();
  if (text) navigator.clipboard?.writeText(text).catch(() => {});
  return !!text;
}
