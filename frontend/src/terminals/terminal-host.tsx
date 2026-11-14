// Places a pane's long-lived xterm element. No store subscription and no props besides the id: React never re-renders
// it for pane/state/status events. Unmounting only detaches the element; the terminal is disposed by watchPaneIds.
import { memo, useLayoutEffect, useRef } from "react";
import { getTerminal } from "./terminal-registry";

export const TerminalHost = memo(function TerminalHost({ paneId }: { paneId: string }) {
  const anchor = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = anchor.current;
    if (!host) return;
    const entry = getTerminal(paneId);
    host.appendChild(entry.el);
    if (entry.refocus) { entry.refocus = false; if (entry.opened) entry.term.focus(); else entry.wantFocus = true; }
    return () => {
      // A layout change re-parents the pane: remember focus so the next mount (same commit) can restore it.
      entry.refocus = entry.el.contains(document.activeElement);
      if (entry.refocus) setTimeout(() => { entry.refocus = false; }, 0);
      if (entry.el.parentNode === host) host.removeChild(entry.el);
    };
  }, [paneId]);
  // `display: contents`: the .term element lays out as a direct flex child of .pane, as in the legacy markup.
  return <div ref={anchor} style={{ display: "contents" }} />;
});
