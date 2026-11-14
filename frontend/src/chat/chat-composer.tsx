// The message box of a chat: type, paste / drop / pick pictures, Enter sends, Stop interrupts the agent.
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";
import { errorToast } from "../core/toast-store";
import { chatActions, loadOptions, searchFiles } from "./chat-actions";
import { MAX_IMAGE_BYTES, fileToBase64, imageType, imagesFrom } from "./chat-images";
import { ChatSuggest, type Suggestion } from "./chat-suggest";
import { activeToken, applySuggestion, filterCommands, stepIndex } from "./chat-suggest-logic";
import { useChats } from "./chat-store";
import type { Chat, ChatImage } from "./chat-types";

interface Picture extends ChatImage { id: number; name: string; preview: string }
let nextId = 1;
const MAX_PICTURES = 8;

export function ChatComposer({ chat }: { chat: Chat }) {
  const [text, setText] = useState("");
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [over, setOver] = useState(false);
  const [caret, setCaret] = useState(0);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const commands = useChats((s) => s.options[chat.id]?.commands);
  const box = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const live = useRef<Picture[]>([]);
  live.current = pictures;
  const idle = chat.state === "idle";
  const canSend = idle && (text.trim() !== "" || pictures.length > 0);

  useEffect(() => () => live.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);
  useEffect(() => { box.current?.focus(); }, [chat.id]);
  const found = activeToken(text, caret);
  const tokenKey = found ? `${found.kind}:${found.start}` : null;
  const token = tokenKey && tokenKey !== dismissed ? found : null; // Esc hides the list for this token only
  const items: Suggestion[] = !token ? [] : token.kind === "command"
    ? filterCommands(commands ?? [], token.query).map((c) => ({ key: c.name, label: `/${c.name}`, detail: c.hint ? `${c.hint} · ${c.description}` : c.description }))
    : files.map((f) => ({ key: f, label: f }));

  useEffect(() => { setIndex(0); }, [token?.kind, token?.query]);
  useEffect(() => { if (token?.kind === "command") void loadOptions(chat.id); }, [token?.kind, chat.id]);
  useEffect(() => { // look the files up shortly after typing stops; an older answer never overwrites a newer one
    if (token?.kind !== "file") { setFiles([]); return; }
    let stale = false;
    const timer = setTimeout(() => { void searchFiles(chat.id, token.query).then((r) => { if (!stale) setFiles(r); }); }, 120);
    return () => { stale = true; clearTimeout(timer); };
  }, [token?.kind, token?.query, chat.id]);

  const pick = (i: number) => {
    const item = items[i];
    if (!token || !item) return;
    const next = applySuggestion(text, token, token.kind === "file" ? `@${item.key}` : `/${item.key}`);
    setText(next.text);
    setCaret(next.caret);
    requestAnimationFrame(() => { box.current?.focus(); box.current?.setSelectionRange(next.caret, next.caret); });
  };

  useEffect(() => { // grow with the text, up to about 9 lines. Never trust a 0 height: the screen can still be hidden when this runs.
    const el = box.current;
    if (!el) return;
    const fit = () => { el.style.height = "auto"; el.style.height = el.scrollHeight > 0 ? `${Math.min(el.scrollHeight, 200)}px` : ""; };
    fit();
    const watch = new ResizeObserver(() => { if (el.offsetWidth > 0 && el.scrollHeight > 0 && el.offsetHeight < 20) fit(); }); // shown later: measure again
    watch.observe(el);
    return () => watch.disconnect();
  }, [text, chat.id]);

  const add = async (files: File[]) => {
    for (const file of files.slice(0, MAX_PICTURES - live.current.length)) {
      if (file.size > MAX_IMAGE_BYTES) { errorToast(new Error(`${file.name || "That picture"} is larger than 10 MB`)); continue; }
      const picture: Picture = { id: nextId++, name: file.name || "Pasted image", media_type: imageType(file)!, data: await fileToBase64(file), preview: URL.createObjectURL(file) };
      setPictures((cur) => [...cur, picture]);
    }
  };
  const remove = (id: number) => setPictures((cur) => { cur.filter((p) => p.id === id).forEach((p) => URL.revokeObjectURL(p.preview)); return cur.filter((p) => p.id !== id); });

  const send = async () => {
    if (!canSend) return;
    const images = pictures.map(({ media_type, data }) => ({ media_type, data }));
    try {
      await chatActions.sendChat(chat.id, text, images);
      pictures.forEach((p) => URL.revokeObjectURL(p.preview));
      setText(""); setPictures([]);
    } catch { /* the failure was already shown; keep the message so nothing is lost */ }
    box.current?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (token) { // the list is open: it takes the arrows, Enter / Tab and Esc
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => stepIndex(i, e.key === "ArrowDown" ? 1 : -1, items.length)); return; }
      if ((e.key === "Enter" || e.key === "Tab") && items.length) { e.preventDefault(); pick(index); return; }
      if (e.key === "Escape") { e.preventDefault(); setDismissed(tokenKey); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
    else if (e.key === "Escape" && !idle) { e.preventDefault(); chatActions.stopChat(chat.id); }
  };
  const onPaste = (e: ClipboardEvent) => {
    const files = imagesFrom(e.clipboardData?.items);
    if (files.length) { e.preventDefault(); void add(files); }
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); void add(imagesFrom(e.dataTransfer?.files)); };

  return (
    <div className="chat-compose-wrap">
      <div className={"composer" + (over ? " over" : "")}
        onDragOver={(e) => { if (e.dataTransfer?.types.includes("Files")) { e.preventDefault(); setOver(true); } }}
        onDragLeave={() => setOver(false)} onDrop={onDrop}>
        {pictures.length ? (
          <div className="cp-files">
            {pictures.map((p) => (
              <div key={p.id} className="cp-thumb" title={p.name}>
                <img src={p.preview} alt={p.name} />
                <button aria-label={`Remove ${p.name}`} onClick={() => remove(p.id)}>×</button>
              </div>
            ))}
          </div>
        ) : null}
        {token ? <ChatSuggest title={token.kind === "file" ? "Files in this project" : "Commands"} items={items} index={index} onPick={pick}
          empty={token.kind === "command" && !commands ? "Loading commands…" : undefined} /> : null}
        <textarea ref={box} rows={1} value={text} spellCheck={false} aria-label={`Message ${chat.name}`}
          placeholder={idle ? "Message Claude… (@ for files, / for commands, Ctrl+V pastes a picture)" : "Claude is working… Esc stops it"}
          onChange={(e) => { setText(e.target.value); setCaret(e.target.selectionStart); }} onKeyDown={onKey} onPaste={onPaste}
          onKeyUp={(e) => setCaret(e.currentTarget.selectionStart)} onClick={(e) => setCaret(e.currentTarget.selectionStart)} />
        <div className="cp-bar-row">
          <button className="cp-tool" aria-label="Attach a picture" title="Attach a picture" onClick={() => picker.current?.click()}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 8" /></svg>
          </button>
          <input ref={picker} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden
            onChange={(e) => { void add(imagesFrom(e.target.files)); e.target.value = ""; }} />
          <span className="grow" />
          {idle ? (
            <button className="cp-send" aria-label="Send" disabled={!canSend} onClick={() => void send()}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          ) : <button className="cp-send stop" aria-label="Stop" title="Stop (Esc)" onClick={() => chatActions.stopChat(chat.id)}>■</button>}
        </div>
      </div>
    </div>
  );
}
