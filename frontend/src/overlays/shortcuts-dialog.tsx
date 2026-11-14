// Keyboard shortcuts sheet (Ctrl+A ?).
import { DIRECT_SHORTCUTS, SHORTCUTS, getPrefixKey } from "../core/keys";
import { openModal } from "./modal-store";
import { shortcutChips } from "./shortcuts-logic";

const K = ({ t }: { t: string }) => <span className="k lg">{t}</span>;

function Shortcuts() {
  return (
    <>
      <div className="mhead">
        <h2>Keyboard shortcuts</h2>
        <span className="meta">VS Code style chords work anywhere. For the rest press <K t="Ctrl" /> <K t={getPrefixKey().toUpperCase()} /> first, then the key.</span>
      </div>
      <div className="keysgrid">
        <div className="kcol">
          <div className="kh">VS Code style</div>
          {DIRECT_SHORTCUTS.map(([chord, label]) => (
            <div className="kr" key={chord + label}>
              <span>{label}</span>
              <span className="keys"><K t={chord} /></span>
            </div>
          ))}
        </div>
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
        Change any of these in <span className="mono">keys.toml</span>. <K t="Ctrl" /> <K t={getPrefixKey().toUpperCase()} /> twice sends a real Ctrl+{getPrefixKey().toUpperCase()} to the agent.
      </div>
    </>
  );
}

export function openShortcuts(): void {
  openModal({ label: "Keyboard shortcuts", size: "keys", body: <Shortcuts /> });
}
