// Phone key strip + message box (CSS shows it only on the phone layout, for the focused pane). The input is
// uncontrolled: typing never re-renders anything.
import { memo, useRef } from "react";
import { DictateButton } from "../shell/mobile-dictate";
import { sendToPane } from "../terminals/terminal-registry";

const KEYS: [string, string][] = [["1", "1"], ["2", "2"], ["3", "3"], ["Esc", "\x1b"], ["Tab", "\t"], ["⇧Tab", "\x1b[Z"],
  ["↑", "\x1b[A"], ["↓", "\x1b[B"], ["←", "\x1b[D"], ["→", "\x1b[C"], ["^C", "\x03"], ["^D", "\x04"], ["⏎", "\r"]];

export const PaneKeybar = memo(function PaneKeybar({ paneId }: { paneId: string }) {
  const compose = useRef<HTMLInputElement>(null);
  const paste = () => { navigator.clipboard?.readText().then((t) => t && sendToPane(paneId, t)).catch(() => {}); };
  const send = () => {
    const input = compose.current;
    if (!input) return;
    sendToPane(paneId, input.value + "\r");
    input.value = "";
  };
  const addText = (text: string) => {
    const input = compose.current;
    if (input) input.value = input.value ? `${input.value} ${text}` : text;
  };
  return (
    <div className="keybar">
      <div className="kb-keys">
        {KEYS.map(([label, data]) => <button key={label} onClick={() => sendToPane(paneId, data)}>{label}</button>)}
        <button onClick={paste} aria-label="Paste">Paste</button>
      </div>
      <div className="kb-compose">
        <input ref={compose} className="compose" placeholder="Message the agent…" aria-label="Message to agent"
          enterKeyHint="send" autoCapitalize="off" autoComplete="off" onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
        <DictateButton onText={addText} />
        <button className="kb-send" onClick={send} aria-label="Send">Send</button>
      </div>
    </div>
  );
});
