// Pure parts of "send the editor selection to an agent" (unit-tested).
import type { Pane } from "../core/protocol-types";
import { sortedPanesOf } from "../shell/shell-logic";

/** The agent pane a selection goes to: the focused one if it belongs to the space, else the most urgent agent there.
 * Plain shells and exited panes are skipped. */
export function pickAgentPane(panes: Pane[], spaceId: string, focusedId: string | null): Pane | undefined {
  const usable = sortedPanesOf(panes, spaceId).filter((p) => p.kind !== "shell" && p.state !== "exited");
  return usable.find((p) => p.id === focusedId) ?? usable[0];
}

/** "path:41-42" plus the code in a fence; with no selection just the location. Ends with a blank line to type after. */
export function formatSelection(path: string, startLine: number, endLine: number, text: string): string {
  const where = endLine > startLine ? `${path}:${startLine}-${endLine}` : `${path}:${startLine}`;
  if (!text.trim()) return `${where} `;
  return `${where}\n\`\`\`\n${text.replace(/\n$/, "")}\n\`\`\`\n`;
}

/** Bracketed paste, so a multi-line snippet lands in the agent's prompt instead of being run line by line. Control
 * characters other than tab and newline are dropped: an ESC in the file could end the paste early (`\x1b[201~`) and
 * type the rest into the agent as keys. */
export const asPaste = (s: string): string =>
  `\x1b[200~${s.replace(/\r\n?/g, "\n").replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "")}\x1b[201~`; // eslint-disable-line no-control-regex
