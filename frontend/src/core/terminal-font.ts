// Terminal font, like a terminal app's profile font. Choose it in Settings > Appearance. Precedence: this device's
// choice (localStorage) > the system terminal's font (the daemon reads GNOME Terminal's) > the browser's monospace
// at 13 px (12 on a phone).
import { isPhone } from "./viewport";

export interface TerminalFont { family: string; size: number }

const KEY = "drover-terminal-font";
const listeners = new Set<() => void>();
let server: TerminalFont = { family: "", size: 0 };
let cached: TerminalFont | null = null;

function stored(): Partial<TerminalFont> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return typeof raw === "object" && raw ? raw : {};
  } catch { return {}; }
}

function clampSize(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? Math.min(40, Math.max(8, Math.round(v))) : 0;
}

/** The chosen family and size before defaults; empty / 0 mean "not set". Stable object for useSyncExternalStore. */
export function chosenTerminalFont(): TerminalFont {
  if (!cached) {
    const own = stored();
    cached = {
      family: (typeof own.family === "string" && own.family.trim()) || server.family,
      size: clampSize(own.size) || server.size,
    };
  }
  return cached;
}

/** What the device has overridden (for the Settings form). */
export function ownTerminalFont(): Partial<TerminalFont> { return stored(); }

/** CSS font-family list for xterm: the chosen font first, monospace as the fallback. */
export function terminalFontFamily(): string {
  const { family } = chosenTerminalFont();
  const quoted = family ? `"${family.replace(/["\\]/g, "")}", ` : "";
  return `${quoted}ui-monospace, monospace`;
}

export function terminalFontSize(): number { return chosenTerminalFont().size || (isPhone() ? 12 : 13); }

export function onTerminalFontChange(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }
const notify = () => { cached = null; listeners.forEach((fn) => fn()); };

/** Save this device's choice; null clears it (back to the system terminal's font). */
export function setTerminalFont(font: Partial<TerminalFont> | null): void {
  try {
    if (font) localStorage.setItem(KEY, JSON.stringify({ family: font.family?.trim() || "", size: clampSize(font.size) }));
    else localStorage.removeItem(KEY);
  } catch { /* private mode: applies for this session only */ }
  notify();
}

export function setServerTerminalFont(raw: unknown): void {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<TerminalFont>;
  const next = { family: typeof r.family === "string" ? r.family : "", size: clampSize(r.size) };
  if (next.family !== server.family || next.size !== server.size) { server = next; notify(); }
}
