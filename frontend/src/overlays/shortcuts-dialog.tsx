// Keyboard shortcuts sheet (Ctrl+B ?).
import { SHORTCUTS } from "../core/keys";
import { openModal } from "./modal-store";
import { shortcutChips } from "./shortcuts-logic";

const K = ({ t }: { t: string }) => <span className="k lg">{t}</span>;

function Shortcuts() {
  return (
    <>
      <div className="mhead">
        <h2>Keyboard shortcuts</h2>
        <span className="meta">Press <K t="Ctrl" /> <K t="B" /> first, then the key. Everything else goes to the agent.</span>
      </div>
      <div className="keysgrid">
        {SHORTCUTS.map(([group, items]) => (
          <div className="kcol" key={group}>
            <div className="kh">{group}</div>
            {items.map(([key, label]) => {
              const { text, keys } = shortcutChips(key, label);
              return (
                <div className="kr" key={key + label}>
                  <span>{text}</span>
                  <span className="keys">{keys.map((p, i) => (p.chip ? <K key={i} t={p.text} /> : p.text))}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="kfoot">
        Change any of these in <span className="mono">keys.toml</span>. <K t="Ctrl" /> <K t="B" /> twice sends a real Ctrl+B to the agent.
      </div>
    </>
  );
}

export function openShortcuts(): void {
  openModal({ label: "Keyboard shortcuts", size: "keys", body: <Shortcuts /> });
}
