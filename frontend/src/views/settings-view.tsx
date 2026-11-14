// Settings: every config file editable in place (validated on save), appearance, detection rules + tester.
import { useEffect } from "react";
import { create } from "zustand";
import { clearTopExtra, setTopExtra } from "../shell/top-extra-store";
import { AppearancePanel } from "./appearance-panel";
import { AgentsMain, RulesColumn, type RuleInfo } from "./settings-agents-section";
import { SettingsFilePanel, canOpenPath, openPath, type SettingsFile } from "./settings-file-panel";
import { useRpc } from "./use-rpc";

// [id, label, file, section marker to scroll to]
const SECTIONS: [string, string, string?, string?][] = [
  ["general", "General", "settings.toml"], ["appearance", "Appearance"], ["notifications", "Notifications", "settings.toml", "[notify]"],
  ["keyboard", "Keyboard", "keys.toml"], ["agents", "Agents & detection"], ["machines", "Machines", "machines.toml"],
  ["policy", "Agent policy", "settings.toml", "[orchestration]"], ["docs", "Notes for agents", "AGENTS.md"],
];

interface SettingsData { dir: string; files: SettingsFile[]; errors: string[] }

/** Section + rule survive leaving the view. */
const useSettingsNav = create<{ section: string; rule: string | null }>(() => ({ section: "general", rule: null }));

export default function SettingsView() {
  const { section, rule } = useSettingsNav();
  const { data, error, reload } = useRpc<SettingsData>("settings.files");
  const { data: rulesData, reload: reloadRules } = useRpc<RuleInfo[]>("rules.list");
  const rules = rulesData || [];
  const sec = SECTIONS.find((s) => s[0] === section) || SECTIONS[0];
  const problems = data?.errors.length || 0;
  const dir = data?.dir;

  useEffect(() => {
    if (dir === undefined) return;
    setTopExtra("settings", {
      meta: <span className="meta mono">{`${dir} · plain files, reloads on save`}</span>,
      right: <>
        <span style={{ fontSize: 12, color: problems ? "var(--error)" : "var(--done)" }}>{problems ? `${problems} problem${problems > 1 ? "s" : ""}` : "✓ All files valid"}</span>
        {canOpenPath() ? <button className="btn" onClick={() => openPath(dir)}>Open folder</button> : null}
      </>,
    });
  }, [dir, problems]);
  useEffect(() => () => clearTopExtra("settings"), []);

  if (error && !data) return <div className="view errtext">{error}</div>;
  if (!data) return null;

  const changed = () => { reload(); reloadRules(); };
  const ruleId = rule && rules.some((r) => r.id === rule) ? rule : rules[0]?.id || null;
  const byName = (n: string): SettingsFile => data.files.find((f) => f.name === n) || { name: n, path: `${data.dir}/${n}`, exists: false, text: "" };

  return (
    <div className="vsplit settings-split ssplit">
      <div className="snav">
        {SECTIONS.map(([id, label]) => (
          <button key={id} className={"nav" + (id === sec[0] ? " on" : "")} onClick={() => useSettingsNav.setState({ section: id })}>{label}</button>
        ))}
        <span className="grow" />
        <div className="snote">Every setting is a file. <span className="mono">AGENTS.md</span> in the folder explains them, so an agent can change herd for you.</div>
      </div>
      {sec[0] === "agents" ? (
        <RulesColumn rules={rules} files={data.files} selected={ruleId} onSelect={(id) => useSettingsNav.setState({ rule: id })} onChanged={changed} />
      ) : null}
      {sec[0] === "appearance" ? <div className="smain"><div className="panel"><AppearancePanel /></div></div>
        : sec[0] === "agents" ? <AgentsMain rule={ruleId} files={data.files} errors={data.errors} onChanged={changed} />
        : <div className="smain"><SettingsFilePanel file={byName(sec[2]!)} errors={data.errors} marker={sec[3]} withTest={sec[0] === "notifications"} onSaved={changed} /></div>}
    </div>
  );
}
