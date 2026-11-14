// The agent asks before doing something: what it wants to do, and Allow / Always allow / Deny.
import { chatActions } from "./chat-actions";
import { permissionQuestion, toolSummary, editDiff } from "./chat-logic";
import type { PermissionItem } from "./chat-types";
import { DiffView } from "./chat-tool-card";

export function PermissionCard({ chatId, item }: { chatId: string; item: PermissionItem }) {
  const pending = item.status === "pending";
  const diff = editDiff(item.tool, item.input);
  const command = item.tool === "Bash" ? String(item.input.command ?? "") : "";
  const subject = toolSummary(item.tool, item.input);
  return (
    <div className={`perm-card ${item.status}`} role={pending ? "alertdialog" : undefined} aria-label={permissionQuestion(item)}>
      <div className="perm-q">{item.title || permissionQuestion(item)}</div>
      {item.detail ? <div className="meta">{item.detail}</div> : null}
      {command ? <pre className="perm-cmd">{command}</pre> : diff ? <DiffView lines={diff} /> : subject ? <div className="mono meta">{subject}</div> : null}
      {pending ? (
        <div className="perm-actions">
          <button className="btn pri" autoFocus onClick={() => chatActions.answerPermission(chatId, item.id, true)}>Allow</button>
          <button className="btn" onClick={() => chatActions.answerPermission(chatId, item.id, true, true)}>Always allow</button>
          <button className="btn danger" onClick={() => chatActions.answerPermission(chatId, item.id, false)}>Deny</button>
        </div>
      ) : <div className="meta">{item.status === "allowed" ? "Allowed" : "Denied"}</div>}
    </div>
  );
}
