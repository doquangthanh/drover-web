// Alt+S / "Send to agent": paste the editor selection (path:lines + code) into an agent's prompt, without pressing Enter.
import type { Space } from "../core/protocol-types";
import { useStore } from "../core/store";
import { toast } from "../core/toast-store";
import { sendToPane } from "../terminals/terminal-registry";
import { getSelection } from "./ace-editor-registry";
import { getFileUi } from "./files-store";
import { asPaste, formatSelection, pickAgentPane } from "./send-to-agent-logic";

export function sendSelectionToAgent(space: Space): void {
  const file = getFileUi(space.id).file, sel = getSelection();
  if (!file || !sel) return;
  const s = useStore.getState();
  const pane = pickAgentPane(s.panes, space.id, s.ui.focusedPane);
  if (!pane) { toast("No agent in this space", "Run claude, codex… in a terminal first."); return; }
  sendToPane(pane.id, asPaste(formatSelection(file, sel.startLine, sel.endLine, sel.text)));
  const name = pane.name || pane.title || pane.kind || "agent";
  toast(`Sent to ${name}`, sel.text ? `${file}:${sel.startLine}-${sel.endLine}` : `${file}:${sel.startLine}`);
}
