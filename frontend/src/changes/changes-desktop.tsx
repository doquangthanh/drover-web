// Desktop Changes layout: worktrees | (header actions, file list, diff).
import { patchChangesUi } from "./changes-store";
import { FileDiffContent } from "./file-diff-content";
import { WorktreeList } from "./worktree-list";
import type { ChangesCtx } from "./changes-ctx";

const baseName = (p: string) => p.slice(p.lastIndexOf("/") + 1);
const dirName = (p: string) => p.slice(0, p.lastIndexOf("/") + 1);

export function ChangesDesktop({ c }: { c: ChangesCtx }) {
  const { files, current, base, path, ui, actions, rpc } = c;
  const selected = files.some((f) => f.path === ui.file) ? ui.file : files[0]?.path ?? null;
  return (
    <div className="vsplit">
      <div className="panel cwt" style={{ width: "300px", flex: "none", padding: "6px" }}>
        <WorktreeList trees={c.trees} mainTree={c.mainTree} current={current} path={path} confirm={ui.confirm} machine={c.machine} actions={actions} />
      </div>
      <div className="panel focus grow">
        <div className="ph" style={{ flexWrap: "wrap", height: "auto", minHeight: "42px" }}>
          <span className="mono" style={{ color: "var(--accent)" }}>{current?.branch || ""}</span><span className="meta">vs</span>
          <input key={base} className="in mono basein" defaultValue={base} aria-label="Compare against"
            onBlur={(e) => { const v = e.currentTarget.value.trim() || "main"; if (v !== base) patchChangesUi({ base: v }); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
          <span className="grow" />
          <button className="btn" onClick={() => actions.run("Commit…", actions.commit)}>Commit…</button>
          {current && current.branch !== base ? <button className="btn" onClick={() => actions.run(`Rebase on ${base}`, actions.rebase)}>{`Rebase on ${base}`}</button> : null}
          <button className="btn pri" onClick={() => actions.run("Push & open PR", actions.pushPr)}>Push &amp; open PR</button>
        </div>
        <div className="csplit" style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div className="cfiles">
            {files.map((f) => (
              <button key={f.path} className={"cf" + (f.path === selected ? " on" : "")} onClick={() => patchChangesUi({ file: f.path })}>
                <span className={"cs " + (f.status || "M")}>{f.status || "M"}</span>
                <span className="mono grow trunc" title={f.path}>{baseName(f.path)}{" "}<span className="dim">{dirName(f.path)}</span></span>
                <span className="add mono">{`+${f.added}`}</span>
                {f.removed ? <span className="rem mono">{`-${f.removed}`}</span> : null}
              </button>
            ))}
            {files.length ? null : <div className="meta" style={{ padding: 8 }}>{"No changes vs " + base}</div>}
          </div>
          <div className="grow" style={{ overflow: "auto", padding: "10px 0" }}>
            {selected ? <FileDiffContent rpc={rpc} path={path} base={base} file={selected} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
