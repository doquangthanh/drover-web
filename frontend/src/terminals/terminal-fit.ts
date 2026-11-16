// Sizing: debounced fit -> `pane.resize` rpc (deduped by size), font-ready refit, lazy GPU renderer.
import { conn } from "../core/connection";
import type { TermEntry } from "./terminal-entry";
import { attachTouchScroll } from "./terminal-touch-scroll";

export const FONT = 'ui-monospace, monospace';

/** xterm measures a character once. If the web font arrives after that, the cells are wider than measured and the grid
 *  overflows the screen (text cut off on the right/bottom). Re-measure when the font is ready. */
function refitWhenFontReady(entry: TermEntry): void {
  document.fonts.load('13px "JetBrains Mono"').then(() => {
    entry.term.options.fontFamily = FONT + ", monospace"; // a changed value makes xterm measure again
    scheduleFit(entry);
  }).catch(() => {});
}

/** GPU renderer: far smoother than the default DOM renderer. Loaded on demand (own chunk); falls back silently. */
function enableWebgl(entry: TermEntry): void {
  // Touch devices keep the DOM renderer: with WebGL the cell size changes after the first fit, so the grid came out wider
  // and taller than the screen (text cut off on the right and bottom), and iOS drops WebGL contexts in the background.
  if (matchMedia("(pointer: coarse)").matches) return;
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
    refitWhenFontReady(entry);
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
