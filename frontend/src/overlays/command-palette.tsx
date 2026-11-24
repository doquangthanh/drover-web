// Command palette (Ctrl+Shift+P): ranked list of every action. Empty query: what suits this screen first. Typing:
// substring matches first, letters-in-order as a fallback; the matched letters are highlighted.
import { Fragment, useMemo, useState } from "react";
import { getActions, keysFor } from "../core/keys";
import { ICON_SETS, setIconSet } from "../core/file-icons";
import { useStore } from "../core/store";
import { THEMES, setTheme } from "../core/theme";
import { Icon, type IconName } from "../ui/atoms/icon";
import { closeModal, openModal } from "./modal-store";
import { buildCommands, searchCommands, splitKeys, suggestedCommands, type PaletteCommand } from "./palette-commands";
import { openQuickfix } from "./quickfix-dialog";
import { useListKeyboardNav } from "./use-list-keyboard-nav";

function run(cmd: PaletteCommand): void {
  const id = cmd[2];
  closeModal();
  if (id === "newSpaceOn") setTimeout(() => getActions().show?.("machines"), 0);
  else if (id === "quickfix") setTimeout(openQuickfix, 0);
  else if (id.startsWith("theme:")) setTheme(id.slice(6));
  else if (id.startsWith("icons:")) setIconSet(id.slice(6));
  else setTimeout(() => getActions()[id]?.({}), 0);
}

/** The label with the matched letters in bold. */
function Label({ text, marks }: { text: string; marks: number[] }) {
  if (!marks.length) return <>{text}</>;
  const on = new Set(marks);
  return <>{[...text].map((ch, i) => (on.has(i) ? <b key={i} className="pm">{ch}</b> : ch))}</>;
}

function Palette() {
  const view = useStore((s) => s.ui.view);
  const commands = useMemo(() => buildCommands(THEMES, ICON_SETS), []);
  const [query, setQuery] = useState("");
  const q = query.replace(/^>\s*/, ""); // a leading ">" is allowed, as in VS Code
  const rows = useMemo(() => {
    if (q.trim()) return searchCommands(commands, q).map((h) => ({ ...h, pinned: false }));
    return [...suggestedCommands(commands, view), ...commands].map((cmd) => ({ cmd, marks: [] as number[], pinned: true }));
  }, [commands, q, view]);
  const searching = !!q.trim();
  const nav = useListKeyboardNav(rows.length, (i) => run(rows[i].cmd), q);

  let group = "";
  return (
    <>
      <div className="mhead">
        <Icon name="chevron" />
        <input className="qin" placeholder="Type a command" aria-label="Command" autoFocus value={query}
          onChange={(e) => setQuery(e.target.value)} onKeyDown={nav.onKeyDown} />
        <span className="k">Esc</span>
      </div>
      <div className="list" ref={nav.listRef}>
        {rows.map(({ cmd: c, marks }, i) => {
          const header = !searching && c[0] !== group ? <div className="sec">{(group = c[0])}</div> : null;
          const keys = keysFor(c[2], c[3]);
          return (
            <Fragment key={`${c[0]}:${c[2]}`}>
              {header}
              <button className={`it${i === nav.selected ? " on" : ""}`} onClick={() => run(c)}>
                {c[4] === "dot" ? <span className="dot blocked" /> : <Icon name={c[4] as IconName} />}
                <span className="lb"><Label text={c[1]} marks={marks} />{searching ? <span className="pgroup">{c[0]}</span> : null}</span>
                {splitKeys(keys).map((k, n) => <span key={n} className="k">{k}</span>)}
              </button>
            </Fragment>
          );
        })}
        {searching && !rows.length ? <div className="meta" style={{ padding: 14 }}>{`Nothing matches "${q.trim()}".`}</div> : null}
      </div>
      <div className="hint">
        <span>↑↓ move</span><span>↵ run</span><span className="grow" />
        <span>{searching ? `${rows.length} of ${commands.length} commands` : `${commands.length} commands`}</span>
      </div>
    </>
  );
}

export function openPalette(): void {
  openModal({ label: "Command palette", size: "pal", body: <Palette /> });
}
