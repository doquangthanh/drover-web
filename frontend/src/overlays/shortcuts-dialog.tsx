// Keyboard shortcuts sheet (Ctrl+K Ctrl+S).
import { SHORTCUTS } from "../core/keys";
import { openModal } from "./modal-store";
import { splitKeys } from "./palette-commands";

const K = ({ t }: { t: string }) => <span className="k lg">{t}</span>;

function Shortcuts() {
  return (
    <>
      <div className="mhead">
        <h2>Keyboard shortcuts</h2>
        <span className="meta">VS Code style. <K t="Ctrl+K" /> <K t="W" /> means press Ctrl+K, let go, then W. Everything else goes to the agent; the rest is in the command palette (<K t="Ctrl+Shift+P" />).</span>
      </div>
      <div className="keysgrid">
        {SHORTCUTS.map(([group, items]) => (
          <div className="kcol" key={group}>
            <div className="kh">{group}</div>
            {items.map(([keys, label]) => (
              <div className="kr" key={keys + label}>
                <span>{label}</span>
                <span className="keys">{splitKeys(keys).map((k, i) => <K key={i} t={k} />)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export function openShortcuts(): void {
  openModal({ label: "Keyboard shortcuts", size: "keys", body: <Shortcuts /> });
}
