// The scrolling message list. Sticks to the bottom while you are there; scroll up to read and a button brings you back.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChatItemView } from "./chat-item-view";
import { NO_ITEMS, useChats } from "./chat-store";
import type { Chat } from "./chat-types";

const NEAR_BOTTOM = 80;

export function ChatTranscript({ chat }: { chat: Chat }) {
  const items = useChats((s) => s.items[chat.id] ?? NO_ITEMS);
  const box = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(true);
  const toBottom = () => { const el = box.current; if (el) el.scrollTop = el.scrollHeight; };

  useLayoutEffect(() => { if (stuck) toBottom(); }, [items, chat.state, stuck]);
  useEffect(() => { setStuck(true); }, [chat.id]);

  const last = items[items.length - 1];
  const showWorking = chat.state === "working" && !(last && (last.kind === "text" || last.kind === "thinking") && last.live);
  return (
    <div className="chat-scroll-wrap">
      <div className="chat-scroll" ref={box} role="log" aria-live="polite"
        onScroll={(e) => { const el = e.currentTarget; setStuck(el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM); }}>
        <div className="chat-col">
          {!items.length ? <div className="chat-hint">Ask anything about this project. Paste or drop a screenshot to show what you mean.</div> : null}
          {items.map((item) => <ChatItemView key={item.id} chatId={chat.id} item={item} />)}
          {showWorking ? <div className="working"><span className="spin" /> Working…</div> : null}
        </div>
      </div>
      {!stuck ? <button className="to-latest" onClick={() => { setStuck(true); toBottom(); }}>Jump to latest ↓</button> : null}
    </div>
  );
}
