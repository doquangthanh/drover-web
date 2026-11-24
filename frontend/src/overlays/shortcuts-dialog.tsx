// Keyboard shortcuts sheet (Ctrl+K Ctrl+S, or ? outside terminals): filter box, your own [web_keys] chords shown in place.
import { useState } from "react";
import { SHORTCUTS, keysFor } from "../core/keys";
import { openModal } from "./modal-store";
import { splitKeys } from "./palette-commands";

const K = ({ t }: { t: string }) => <span className="k lg">{t}</span>;

function Shortcuts() {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const groups = SHORTCUTS.map(([group, items]) => [group, items.filter(([keys, label, action]) =>
    !needle || label.toLowerCase().includes(needle) || keysFor(action, keys).toLowerCase().includes(needle) || group.toLowerCase().includes(needle))] as const)
    .filter(([, items]) => items.length);
  return (
    <>
      <div className="mhead">
        <h2>Keyboard shortcuts</h2>
        <input className="qin" placeholder="Filter by name or key" aria-label="Filter shortcuts" autoFocus value={q} onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 240, marginLeft: "auto" }} />
      </div>
      <div className="meta" style={{ padding: "0 20px" }}>
        VS Code style. <K t="Ctrl+K" /> <K t="W" /> means press Ctrl+K, let go, then W. Everything else goes to the agent; the rest is in the command palette (<K t="Ctrl+Shift+P" />).
        {" "}Change a key in Settings → Keyboard: <span className="mono">[web_keys]</span> in keys.toml. A changed key is marked <span className="pm">●</span>.
      </div>
      <div className="keysgrid">
        {groups.map(([group, items]) => (
          <div className="kcol" key={group}>
            <div className="kh">{group}</div>
            {items.map(([keys, label, action]) => {
              const shown = keysFor(action, keys);
              return (
                <div className="kr" key={keys + label}>
                  <span>{label}</span>
                  <span className="keys">
                    {shown !== keys ? <span className="pm" title="Your own key (keys.toml)">●</span> : null}
                    {splitKeys(shown).map((k, i) => <K key={i} t={k} />)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
        {!groups.length ? <div className="meta" style={{ padding: 14 }}>{`No shortcut matches "${q.trim()}".`}</div> : null}
      </div>
    </>
  );
}

export function openShortcuts(): void {
  openModal({ label: "Keyboard shortcuts", size: "keys", body: <Shortcuts /> });
}
