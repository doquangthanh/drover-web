// Finger scrolling for an xterm.js terminal. xterm has no touch handling (its canvas sits above the scrollable
// viewport) and the page itself never scrolls, so a drag on the terminal used to do nothing at all.
//   - drag = scroll the scrollback, with a little momentum after the finger lifts
//   - a drag never counts as a tap, so it does not focus the terminal or pop the keyboard up
//   - full-screen apps (vim, htop: "alternate" buffer) have no scrollback, so the drag sends arrow keys instead
//   - a "jump to latest" button appears while the view is scrolled up
import type { Terminal } from "@xterm/xterm";

const DRAG_PX = 6;          // movement before a touch stops being a tap
const MAX_ARROWS = 30;      // keys sent per frame in a full-screen app
const FRICTION = 0.94;      // momentum decay per frame
const STOP_SPEED = 0.03;    // px/ms below which momentum ends

export function attachTouchScroll(term: Terminal, el: HTMLElement, sendKeys: (keys: string) => void): void {
  let startY = 0, lastY = 0, lastT = 0, speed = 0, dragging = false, frame = 0, rest = 0;

  const lineHeight = () => (term.element?.querySelector(".xterm-screen")?.clientHeight || el.clientHeight) / term.rows;

  // px > 0 means the finger moved down = show older output
  function scrollBy(px: number): void {
    rest += px / lineHeight();
    const lines = Math.trunc(rest);
    if (!lines) return;
    rest -= lines;
    if (term.buffer.active.type === "alternate") {
      const arrow = (term.modes.applicationCursorKeysMode ? "\x1bO" : "\x1b[") + (lines > 0 ? "A" : "B");
      sendKeys(arrow.repeat(Math.min(Math.abs(lines), MAX_ARROWS)));
    } else {
      term.scrollLines(-lines);
    }
  }

  function glide(): void {
    if (Math.abs(speed) < STOP_SPEED) { frame = 0; return; }
    scrollBy(speed * 16);
    speed *= FRICTION;
    frame = requestAnimationFrame(glide);
  }

  el.addEventListener("touchstart", (e) => {
    cancelAnimationFrame(frame); frame = 0;
    if (e.touches.length !== 1) return;
    startY = lastY = e.touches[0].clientY; lastT = e.timeStamp; speed = 0; dragging = false; rest = 0;
  }, { passive: true, capture: true });

  el.addEventListener("touchmove", (e) => {
    if (e.touches.length !== 1) return;
    const y = e.touches[0].clientY;
    if (!dragging && Math.abs(y - startY) < DRAG_PX) return;
    dragging = true;
    e.preventDefault();
    const dt = Math.max(1, e.timeStamp - lastT);
    speed = 0.8 * speed + 0.2 * ((y - lastY) / dt);
    scrollBy(y - lastY);
    lastY = y; lastT = e.timeStamp;
  }, { passive: false, capture: true });

  el.addEventListener("touchend", (e) => {
    if (!dragging) return;
    e.preventDefault(); // no synthetic click: dragging must not focus the terminal / open the keyboard
    dragging = false;
    if (e.timeStamp - lastT < 80) frame = requestAnimationFrame(glide);
  }, { passive: false, capture: true });

  // "jump to latest" while the view is scrolled up
  const jump = document.createElement("button");
  jump.className = "term-bottom";
  jump.type = "button";
  jump.setAttribute("aria-label", "Jump to latest output");
  jump.addEventListener("pointerdown", (e) => e.preventDefault()); // keep focus in the terminal so the keyboard stays open
  jump.addEventListener("click", () => term.scrollToBottom());
  el.append(jump);
  const sync = () => { const b = term.buffer.active; jump.classList.toggle("on", b.type === "normal" && b.viewportY < b.baseY); };
  term.onScroll(sync);
  term.onWriteParsed(sync);
}
