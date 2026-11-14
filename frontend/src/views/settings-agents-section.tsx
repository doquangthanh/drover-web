// Settings > Agents & detection: per-agent rule files plus the rule tester.
import { conn } from "../core/connection";
import { errorToast } from "../core/toast-store";
import { KindIcon } from "../ui/atoms/kind-icon";
import { RuleTester } from "./rule-tester";
import { SettingsFilePanel, type SettingsFile } from "./settings-file-panel";

export interface RuleInfo { id: string; source: string }

const STARTER_RULE = `id = "myagent"
aliases = []
resume = ""

[[rules]]
id = "needs_answer"
state = "blocked"
priority = 900
region = "bottom(15)"
regex = ['Do you want to proceed']
`;

const writeRule = (id: string) => conn.rpc("settings.write", { name: `rules/${id}.toml`, text: STARTER_RULE.replace("myagent", id) });

interface ColumnProps { rules: RuleInfo[]; files: SettingsFile[]; selected: string | null; onSelect: (id: string) => void; onChanged: () => void }

export function RulesColumn({ rules, files, selected, onSelect, onChanged }: ColumnProps) {
  const mine = new Set(files.map((f) => f.name));
  const add = async () => {
    const id = window.prompt("Agent id for the new rule file (e.g. aider)");
    if (!id || !/^[a-z0-9_-]+$/.test(id)) return;
    try { await writeRule(id); onSelect(id); onChanged(); } catch (e) { errorToast(e); }
  };
  return (
    <div className="scol">
      <div className="meta" style={{ padding: "4px 10px 8px" }}>Detection rules</div>
      {rules.map((r) => (
        <button key={r.id} className={"ag" + (selected === r.id ? " on" : "")} onClick={() => onSelect(r.id)}>
          <KindIcon kind={r.id} /><span className="grow">{r.id}</span><span className="meta">{mine.has(`rules/${r.id}.toml`) ? "yours" : r.source}</span>
        </button>
      ))}
      <button className="ag" style={{ color: "var(--accent)" }} onClick={add}>+ Add agent rules</button>
    </div>
  );
}

interface MainProps { rule: string | null; files: SettingsFile[]; errors: string[]; onChanged: () => void }

export function AgentsMain({ rule, files, errors, onChanged }: MainProps) {
  const own = rule ? files.find((f) => f.name === `rules/${rule}.toml`) : undefined;
  const create = async () => { try { await writeRule(rule!); onChanged(); } catch (e) { errorToast(e); } };
  return (
    <div className="smain">
      {own ? <SettingsFilePanel file={own} errors={errors} onSaved={onChanged} /> : (
        <div className="panel" style={{ padding: 12, gap: 8 }}>
          <div className="meta">{rule ? `${rule} uses herd's built-in rules.` : "No agents yet."}</div>
          {rule ? <button className="btn" style={{ alignSelf: "flex-start" }} onClick={create}>{`Create rules/${rule}.toml to override them`}</button> : null}
        </div>
      )}
      <div className="row rtest"><RuleTester /></div>
    </div>
  );
}
