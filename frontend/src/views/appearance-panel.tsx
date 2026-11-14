// Settings > Appearance: theme cards and file-icon sets, each a small live preview (choice is kept per device).
import { useSyncExternalStore, type CSSProperties } from "react";
import { ICON_SETS, chosenIconSet, onIconSetChange, setIconSet } from "../core/file-icons";
import { THEMES, chosenTheme, onThemeChange, setTheme } from "../core/theme";
import { FileIcon } from "../files/file-icon";

const PREVIEW: Record<string, { cv: string; ch: string; cp: string; fg: string; mu: string; ac: string; bd: string; ok: string; note: string }> = {
  dark: { cv: "#131518", ch: "#101114", cp: "#17191d", fg: "#eeeeef", mu: "#98999b", ac: "#96b2d7", bd: "rgba(255,255,255,.1)", ok: "#a6bd91", note: "default" },
  light: { cv: "#eef0f3", ch: "#e4e7eb", cp: "#ffffff", fg: "#1a1c20", mu: "#5b6270", ac: "#2f6bb3", bd: "rgba(0,0,0,.1)", ok: "#1a7f4b", note: "" },
  midnight: { cv: "#0b0e17", ch: "#080a12", cp: "#0f1320", fg: "#e6e9f5", mu: "#8e97b5", ac: "#7c9cff", bd: "rgba(255,255,255,.1)", ok: "#8fd3a8", note: "" },
};

const Av = ({ c }: { c: string }) => <span className="pav" style={{ background: c }} />;
const PRow = ({ c, t }: { c: string; t: string }) => <div className="prow"><Av c={c} />{t}</div>;

function ThemeCard({ id, label, on }: { id: string; label: string; on: boolean }) {
  const p = PREVIEW[id];
  const vars = { "--cv": p.cv, "--ch": p.ch, "--cp": p.cp, "--fg": p.fg, "--mu": p.mu, "--ac": p.ac, "--bd": p.bd } as CSSProperties;
  return (
    <button className={"tcard" + (on ? " on" : "")} onClick={() => setTheme(id)} aria-pressed={on}>
      <div className="tprev" style={vars}>
        <div className="ptb"><Av c={p.ac} />herd<span className="grow" />shop-api</div>
        <div className="pbody">
          <div className="psb"><PRow c="#24877b" t="shop-api" /><PRow c="#b9602f" t="blog" /><PRow c="#4e7fe0" t="docs" /></div>
          <div className="ptm">
            <div><span style={{ color: p.ok }}>●</span> Update(src/auth/jwt.py)</div>
            <div>  ⎿ 3 additions, 1 removal</div>
            <div style={{ color: p.ac }}>❯ 1. Yes</div>
          </div>
        </div>
      </div>
      <div className="tname">{label}{p.note ? <span className="dim">{` · ${p.note}`}</span> : null}</div>
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
        {["dark", "light", "midnight"].map((id) => <ThemeCard key={id} id={id} label={THEMES.find((t) => t[0] === id)![1]} on={theme === id} />)}
      </div>
      <label className="ck" style={{ margin: "10px 0 0" }}>
        <input type="checkbox" checked={theme === "auto"} onChange={(e) => setTheme(e.target.checked ? "auto" : "dark")} />
        Auto: follow the system (light or dark)
      </label>
      <div className="alab" style={{ marginTop: 22 }}>FILE ICONS</div>
      <div className="agrid">{ICON_SETS.map((s) => <IconCard key={s[0]} set={s} on={iconSet === s[0]} />)}</div>
      <p className="meta" style={{ lineHeight: 1.6, marginTop: 18 }}>
        In <span className="mono">settings.toml</span>: <span className="mono">theme = "light"</span> and <span className="mono">file_icons = "badge"</span>.
        {" "}A choice made in the app is kept per device (phone and desktop can differ) and wins over the file.
      </p>
    </div>
  );
}
