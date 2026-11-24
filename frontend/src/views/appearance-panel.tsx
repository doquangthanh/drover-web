// Settings > Appearance: theme cards and file-icon sets, each a small live preview (choice is kept per device).
import { useSyncExternalStore, type CSSProperties } from "react";
import { ICON_SETS, chosenIconSet, onIconSetChange, setIconSet } from "../core/file-icons";
import { chosenTheme, onThemeChange, setTheme } from "../core/theme";
import { THEME_DEFS, THEME_PREVIEW } from "../core/theme-data.generated";
import { FileIcon } from "../files/file-icon";
import { TerminalFontSettings } from "./terminal-font-settings";

const Av = ({ c }: { c: string }) => <span className="pav" style={{ background: c }} />;
const PRow = ({ c, t }: { c: string; t: string }) => <div className="prow"><Av c={c} />{t}</div>;

function ThemeCard({ id, label, note, on }: { id: string; label: string; note: string; on: boolean }) {
  const p = THEME_PREVIEW[id];
  const vars = { "--cv": p.cv, "--ch": p.ch, "--cp": p.cp, "--fg": p.fg, "--mu": p.mu, "--ac": p.ac, "--bd": p.bd } as CSSProperties;
  return (
    <button className={"tcard" + (on ? " on" : "")} onClick={() => setTheme(id)} aria-pressed={on}>
      <div className="tprev" style={vars}>
        <div className="ptb"><Av c={p.ac} />drover<span className="grow" />shop-api</div>
        <div className="pbody">
          <div className="psb"><PRow c="#24877b" t="shop-api" /><PRow c="#b9602f" t="blog" /><PRow c="#4e7fe0" t="docs" /></div>
          <div className="ptm">
            <div><span style={{ color: p.ok }}>●</span> Update(src/auth/jwt.py)</div>
            <div>  ⎿ 3 additions, 1 removal</div>
            <div style={{ color: p.ac }}>❯ 1. Yes</div>
          </div>
        </div>
      </div>
      <div className="tname">{label}{note ? <span className="dim">{` · ${note}`}</span> : null}</div>
    </button>
  );
}

const SAMPLE: [string, boolean, boolean, number][] = [
  ["docs", true, true, 0], ["README.md", false, false, 1], ["src", true, true, 0], ["app.py", false, false, 1],
  ["App.tsx", false, false, 1], ["package.json", false, false, 0], ["Dockerfile", false, false, 0],
];

function IconCard({ set, on }: { set: [string, string, string]; on: boolean }) {
  const [id, label, tip] = set;
  return (
    <button className={"icard" + (on ? " on" : "")} onClick={() => setIconSet(id)} aria-pressed={on} title={tip}>
      <div className={"ilist" + (id === "line" ? " line" : "")}>
        {SAMPLE.map(([name, dir, open, depth]) => (
          <div className="irow" key={name} style={{ paddingLeft: depth ? 17 : 0 }}>
            <span className="icr">{dir ? (open ? "▾" : "▸") : ""}</span><FileIcon name={name} dir={dir} open={open} set={id} />{name}
          </div>
        ))}
      </div>
      <div className="tname">{label}<span className="dim">{` · ${tip.split(" (")[0].toLowerCase()}`}</span></div>
    </button>
  );
}

export function AppearancePanel() {
  const theme = useSyncExternalStore(onThemeChange, chosenTheme);
  const iconSet = useSyncExternalStore(onIconSetChange, chosenIconSet);
  return (
    <div className="appearance">
      <div className="alab">THEME</div>
      <div className="agrid">
        {THEME_DEFS.map((t) => <ThemeCard key={t.id} id={t.id} label={t.label} note={t.note} on={theme === t.id} />)}
      </div>
      <label className="ck" style={{ margin: "10px 0 0" }}>
        <input type="checkbox" checked={theme === "auto"} onChange={(e) => setTheme(e.target.checked ? "auto" : "dark")} />
        Auto: follow the system (light or dark)
      </label>
      <div className="alab" style={{ marginTop: 22 }}>FILE ICONS</div>
      <div className="agrid">{ICON_SETS.map((s) => <IconCard key={s[0]} set={s} on={iconSet === s[0]} />)}</div>
      <TerminalFontSettings />
      <p className="meta" style={{ lineHeight: 1.6, marginTop: 18 }}>
        In <span className="mono">settings.toml</span>: <span className="mono">theme = "light"</span> and <span className="mono">file_icons = "badge"</span>.
        {" "}A choice made in the app is kept per device (phone and desktop can differ) and wins over the file.
      </p>
    </div>
  );
}
