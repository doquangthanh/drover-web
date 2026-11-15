// Chats in the sidebar's Agents list. Click opens; double-click or F2 renames in place; Delete, middle-click or × removes.
import { memo } from "react";
import { openContextMenu } from "../core/context-menu-store";
import { useRenaming } from "../core/inline-rename-store";
import { ago } from "../core/format";
import { useStore } from "../core/store";
import { InlineNameInput } from "../shell/inline-name-input";
import { StateMark } from "../ui/atoms/state-mark";
import { chatActions } from "./chat-actions";
import type { Chat } from "./chat-types";

const Bubble = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="chat-ico">
    <path d="M4 5h16v11H9l-5 4z" />
  </svg>
);

function RowTool({ label, onRun, children }: { label: string; onRun: () => void; children: string }) {
  return (
    <span className="sclose" role="button" tabIndex={0} title={label} aria-label={label}
      onClick={(e) => { e.stopPropagation(); onRun(); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onRun(); } }}>{children}</span>
  );
}

const ChatRow = memo(function ChatRow({ chat, on }: { chat: Chat; on: boolean }) {
  const key = `chat:${chat.id}`;
  const renaming = useRenaming((s) => s.key === key);
  const rename = () => void chatActions.renameChat(chat.id);
  const remove = () => void chatActions.removeChat(chat.id);
  return (
    <button data-key={key} className={`srow ${chat.state}` + (on ? " on" : "")} title={`Chat · ${chat.cwd}`}
      onClick={() => chatActions.openChat(chat.id)} onDoubleClick={rename}
      onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
      onAuxClick={(e) => { if (e.button === 1) remove(); }}
      onKeyDown={(e) => { if (e.key === "F2") { e.preventDefault(); rename(); } else if (e.key === "Delete") { e.preventDefault(); remove(); } }}
      onContextMenu={(e) => openContextMenu(e, [
        { label: "Rename…", hint: "F2", run: rename },
        { label: "Delete chat", hint: "Del", danger: true, run: remove },
      ])}>
      <Bubble />
      {renaming ? <InlineNameInput value={chat.name} onCommit={(n) => chatActions.setChatName(chat.id, n)} />
        : <span className="nm grow trunc">{chat.name}</span>}
      <span className="t">{ago(chat.updated_at)}</span>
      <StateMark pane={{ state: chat.state }} />
      <RowTool label={`Rename ${chat.name}`} onRun={rename}>✎</RowTool>
      <RowTool label={`Delete ${chat.name}`} onRun={remove}>×</RowTool>
    </button>
  );
});

const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
/** Same folder, whatever the slash style or case (Windows paths). */
export const sameDir = (a?: string, b?: string) => !!a && !!b && norm(a) === norm(b);

/** Chat rows live in the Agents list: under the space with the same folder, else at the end. */
export function ChatRowList({ chats }: { chats: Chat[] }) {
  const current = useStore((s) => (s.ui.view === "chat" ? s.ui.chatId : null));
  return <>{chats.map((c) => <ChatRow key={c.id} chat={c} on={current === c.id} />)}</>;
}
