// The chat screen of one agent: header (name, folder, state, how much it may do alone), messages, message box.
import { useEffect } from "react";
import { shortPath } from "../core/format";
import { useStore } from "../core/store";
import { StateMark } from "../ui/atoms/state-mark";
import { chatActions, loadHistory } from "./chat-actions";
import { ChatComposer } from "./chat-composer";
import { useChats } from "./chat-store";
import { ModelPicker } from "./chat-model-picker";
import { ChatTranscript } from "./chat-transcript";
import { MODE_LABELS, type Chat, type PermissionMode } from "./chat-types";

function ChatHeader({ chat }: { chat: Chat }) {
  return (
    <div className="chat-head">
      <div className="chat-title">
        <strong className="trunc">{chat.name}</strong>
        <span className="meta trunc" title={chat.cwd}>{shortPath(chat.cwd)}</span>
      </div>
      <StateMark pane={{ state: chat.state }} />
      <ModelPicker chat={chat} />
      <select className="in chat-mode" aria-label="How much may the agent do without asking" value={chat.permission_mode}
        onChange={(e) => chatActions.setChatMode(chat.id, e.target.value as PermissionMode)}>
        {(Object.keys(MODE_LABELS) as PermissionMode[]).map((m) => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
      </select>
      <button className="ibtn" title="Rename" aria-label="Rename chat" onClick={() => void chatActions.renameChat(chat.id)}>✎</button>
      <button className="ibtn" title="Delete chat" aria-label="Delete chat" onClick={() => void chatActions.removeChat(chat.id)}>×</button>
    </div>
  );
}

export function ChatView() {
  const chatId = useStore((s) => s.ui.chatId);
  const chat = useChats((s) => s.chats.find((c) => c.id === chatId));
  useEffect(() => { if (chatId) void loadHistory(chatId); }, [chatId]);
  if (!chat) return <div className="chat-empty">Pick a chat in the sidebar, or start one with New agent → Chat.</div>;
  return (
    <div className="chat" data-chat={chat.id}>
      <ChatHeader chat={chat} />
      <ChatTranscript chat={chat} />
      <ChatComposer chat={chat} />
    </div>
  );
}
