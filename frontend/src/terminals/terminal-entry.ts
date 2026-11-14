// One long-lived xterm per pane. The element is moved around by <TerminalHost>; React never owns its content.
import type { FitAddon } from "@xterm/addon-fit";
import type { Terminal } from "@xterm/xterm";

export interface TermEntry {
  paneId: string;
  el: HTMLDivElement;
  term: Terminal;
  fit: FitAddon;
  opened: boolean;
  lastSize: string;
  resizeTimer: ReturnType<typeof setTimeout> | undefined;
  observer: ResizeObserver;
  /** focus was inside the element when its host unmounted (layout change): restore on the next mount */
  refocus: boolean;
  /** focus requested before the terminal was opened (new pane): honoured right after `term.open` */
  wantFocus: boolean;
  findIndex: number;
  findQuery: string;
}
