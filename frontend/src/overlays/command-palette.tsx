// Command palette (Ctrl+A :): fuzzy list of every action.
import { Fragment, useMemo, useState } from "react";
import { getActions } from "../core/keys";
import { ICON_SETS, setIconSet } from "../core/file-icons";
import { THEMES, setTheme } from "../core/theme";
import { Icon, type IconName } from "../ui/atoms/icon";
import { closeModal, openModal } from "./modal-store";
import { buildCommands, filterCommands, splitKeys, type PaletteCommand } from "./palette-commands";
import { useListKeyboardNav } from "./use-list-keyboard-nav";

function run(cmd: PaletteCommand): void {
  const id = cmd[2];
  closeModal();
  if (id === "newSpaceOn") setTimeout(() => getActions().show?.("machines"), 0);
  else if (id.startsWith("theme:")) setTheme(id.slice(6));
  else if (id.startsWith("icons:")) setIconSet(id.slice(6));
  else setTimeout(() => getActions()[id]?.({}), 0);
}

function Palette() {
  const commands = useMemo(() => buildCommands(THEMES, ICON_SETS), []);
  const [query, setQuery] = useState("");
  const shown = useMemo(() => filterCommands(commands, query), [commands, query]);
  const nav = useListKeyboardNav(shown.length, (i) => run(shown[i]), query);

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
        {shown.map((c, i) => {
          const header = c[0] !== group ? <div className="sec">{(group = c[0])}</div> : null;
          return (
            <Fragment key={c[2]}>
              {header}
              <button className={`it${i === nav.selected ? " on" : ""}`} onClick={() => run(c)}>
                {c[4] === "dot" ? <span className="dot blocked" /> : <Icon name={c[4] as IconName} />}
                <span className="lb">{c[1]}</span>
                {splitKeys(c[3]).map((k, n) => <span key={n} className="k">{k}</span>)}
              </button>
            </Fragment>
          );
        })}
      </div>
      <div className="hint">
        <span>↑↓ move</span><span>↵ run</span><span className="grow" />
        <span>{shown.length} of {commands.length} commands</span>
      </div>
    </>
  );
}

export function openPalette(): void {
  openModal({ label: "Command palette", size: "pal", body: <Palette /> });
}
