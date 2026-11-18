// Phone message box: a microphone button that dictates with the browser's speech recognition.
// Renders nothing where the browser has none (Firefox). Phase 8 places it inside the key bar's `.kb-compose`.
import { useRef, useState } from "react";

interface Recognizer {
  lang: string; interimResults: boolean; onend: (() => void) | null; onerror: (() => void) | null;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start(): void; stop(): void;
}
const Recognition: (new () => Recognizer) | undefined =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function DictateButton({ onText }: { onText: (text: string) => void }) {
  const rec = useRef<Recognizer | null>(null);
  const [on, setOn] = useState(false);
  if (!Recognition) return null;
  const stop = () => { setOn(false); rec.current = null; };
  const toggle = () => {
    if (rec.current) { rec.current.stop(); return; }
    try {
      const r = new Recognition();
      r.lang = navigator.language || "en-US";
      r.interimResults = false;
      r.onresult = (e) => {
        const text = Array.from(e.results).map((x) => x[0].transcript).join(" ").trim();
        if (text) onText(text);
      };
      r.onend = stop;
      r.onerror = stop;
      rec.current = r;
      r.start();
      setOn(true);
    } catch { stop(); }
  };
  return (
    <button type="button" className="kb-mic" aria-label="Dictate" aria-pressed={on} onClick={toggle}>
      <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    </button>
  );
}
