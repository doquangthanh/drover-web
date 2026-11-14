// One transcript entry. The kind decides the look: bubble, prose, thinking, tool card, permission card, result line, notice.
import { memo, useState } from "react";
import { CopyButton } from "./chat-copy-button";
import { formatDuration } from "./chat-logic";
import { Markdown } from "./chat-markdown";
import { PermissionCard } from "./chat-permission-card";
import { ToolCard } from "./chat-tool-card";
import type { ChatItem } from "./chat-types";

function Thinking({ text, live }: { text: string; live?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="thinking">
      <button onClick={() => setOpen(!open)} aria-expanded={open}>{live ? "Thinking…" : "Thought"} {open ? "▾" : "▸"}</button>
      {open ? <div className="thinking-text">{text}</div> : null}
    </div>
  );
}

export const ChatItemView = memo(function ChatItemView({ chatId, item }: { chatId: string; item: ChatItem }) {
  switch (item.kind) {
    case "user":
      return (
        <div className="cmsg user">
          {item.images.length ? (
            <div className="cmsg-images">{item.images.map((im, i) => <img key={i} alt="attached" src={`data:${im.media_type};base64,${im.data}`} />)}</div>
          ) : null}
          {item.text ? <div className="cmsg-text">{item.text}</div> : null}
          {item.text ? <CopyButton className="cmsg-copy" text={item.text} /> : null}
        </div>
      );
    case "text":
      return (
        <div className={"cmsg assistant" + (item.live ? " live" : "")}>
          <Markdown text={item.text} />
          {item.live ? null : <CopyButton className="cmsg-copy" text={item.text} />}
        </div>
      );
    case "thinking": return item.text ? <Thinking text={item.text} live={item.live} /> : null;
    case "tool": return <ToolCard item={item} />;
    case "permission": return <PermissionCard chatId={chatId} item={item} />;
    case "result":
      return item.ok ? (
        <div className="turn-end">Done in {formatDuration(item.ms)}</div>
      ) : <div className="notice error">{item.error || "The turn ended with an error."}</div>;
    case "notice": return <div className={"notice " + item.level}>{item.text}</div>;
  }
});
