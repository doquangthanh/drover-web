// Sizing: debounced fit -> `pane.resize` rpc (deduped by size), font-ready refit, lazy GPU renderer.
import { conn } from "../core/connection";
import { chosenTerminalFont, terminalFontFamily, terminalFontSize } from "../core/terminal-font";
import type { TermEntry } from "./terminal-entry";
import { attachTouchScroll } from "./terminal-touch-scroll";

/** Apply the chosen terminal font. xterm measures a character once; if the font arrives after that, the cells are
 *  wider than measured and the grid overflows the screen. So re-measure once the font is loaded too. */
export function applyTerminalFont(entry: TermEntry): void {
  const family = terminalFontFamily();
  const size = terminalFontSize();
  entry.term.options.fontFamily = family;
  entry.term.options.fontSize = size;
  scheduleFit(entry);
  const name = chosenTerminalFont().family;
  if (!name) return;
  document.fonts.load(`${size}px "${name.replace(/["\\]/g, "")}"`).then(() => {
    entry.term.options.fontFamily = family + ", monospace"; // a changed value makes xterm measure again
    scheduleFit(entry);
  }).catch(() => {});
}

/** Whether to use xterm's WebGL renderer, or keep the DOM one.
 *  - Touch devices keep DOM: with WebGL the cell size changes after the first fit, so the grid came out wider and taller
 *    than the screen (text cut off on the right and bottom), and iOS drops WebGL contexts in the background.
 *  - The Linux desktop window (Qt WebEngine) keeps DOM: there WebGL draws every glyph in a small fallback font, whatever
 *    the terminal font, inside correctly sized cells, so text looks letter-spaced ("k h a c  v ớ i"). */
export function useWebglRenderer(userAgent: string, coarsePointer: boolean): boolean {
  return !coarsePointer && !/QtWebEngine\//.test(userAgent);
}

/** GPU renderer: far smoother than the default DOM renderer. Loaded on demand (own chunk); falls back silently. */
function enableWebgl(entry: TermEntry): void {
  if (!useWebglRenderer(navigator.userAgent, matchMedia("(pointer: coarse)").matches)) return;
  import("@xterm/addon-webgl").then(({ WebglAddon }) => {
    try {
      const gl = new WebglAddon();
      gl.onContextLoss(() => gl.dispose()); // xterm falls back to the DOM renderer
      gl.onChangeTextureAtlas(() => scheduleFit(entry)); // WebGL's real cell size is known only after its first render
      entry.term.loadAddon(gl);
    } catch { /* no WebGL available, or the terminal was disposed meanwhile */ }
  }).catch(() => {});
}

export function scheduleFit(entry: TermEntry): void {
  if (!entry.el.isConnected || entry.el.offsetWidth < 20 || entry.el.offsetHeight < 20) return;
  if (!entry.opened) {
    entry.term.open(entry.el);
    entry.opened = true;
    attachTouchScroll(entry.term, entry.el, (keys) => conn.input(entry.paneId, keys));
    enableWebgl(entry);
    applyTerminalFont(entry);
    if (entry.wantFocus) { entry.wantFocus = false; entry.term.focus(); }
  }
  clearTimeout(entry.resizeTimer);
  entry.resizeTimer = setTimeout(() => {
    try { entry.fit.fit(); } catch { return; }
    const size = `${entry.term.cols}x${entry.term.rows}`;
    if (size !== entry.lastSize) {
      entry.lastSize = size;
      conn.rpc("pane.resize", { pane: entry.paneId, cols: entry.term.cols, rows: entry.term.rows }).catch(() => {});
    }
  }, 60);
}
