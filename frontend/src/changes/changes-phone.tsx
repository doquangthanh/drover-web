// Changes on a phone: two steps instead of one cramped screen.
//   list : branch + totals, the files (name first, folder under it), a bottom bar with Commit / Push & open PR / More
//   diff : one file full screen, previous / next file, line wrap on by default (no sideways scrolling to read code)
import { openChangesSheet } from "./changes-phone-sheet";
import { patchChangesUi } from "./changes-store";
import { FileDiffContent } from "./file-diff-content";
import { WorktreeList } from "./worktree-list";
import type { ChangesCtx } from "./changes-ctx";

const split = (p: string): [string, string] => { const i = p.lastIndexOf("/"); return i < 0 ? ["", p] : [p.slice(0, i + 1), p.slice(i + 1)]; };

function DiffScreen({ c }: { c: ChangesCtx }) {
  const { files, ui, rpc, path, base } = c;
  const i = Math.max(0, files.findIndex((f) => f.path === ui.file));
  const [dir, name] = split(files[i].path);
  const go = (n: number) => patchChangesUi({ file: files[(n + files.length) % files.length].path });
  return (
    <div className="cphone">
      <div className="cdh">
        <button className="ibtn" aria-label="Back to files" onClick={() => patchChangesUi({ stage: "list" })}>‹</button>
        <div className="grow cdt">
          <div className="trunc cdn">{name}</div>
          <div className="trunc meta mono">{`${i + 1}/${files.length} · ${dir || "/"}`}</div>
        </div>
        <button className={"chip sm" + (ui.wrap ? " on" : "")} aria-pressed={ui.wrap} onClick={() => patchChangesUi({ wrap: !ui.wrap })}>Wrap</button>
        <button className="ibtn" aria-label="Previous file" disabled={files.length < 2} onClick={() => go(i - 1)}>↑</button>
        <button className="ibtn" aria-label="Next file" disabled={files.length < 2} onClick={() => go(i + 1)}>↓</button>
      </div>
      <div className={"cdb" + (ui.wrap ? " wrap" : "")}>
        <FileDiffContent rpc={rpc} path={path} base={base} file={files[i].path} errorPad={14} />
      </div>
    </div>
  );
}

function ListScreen({ c }: { c: ChangesCtx }) {
  const { files, current, trees, ui, base, actions } = c;
  const added = files.reduce((n, f) => n + (f.added || 0), 0), removed = files.reduce((n, f) => n + (f.removed || 0), 0);
  return (
    <div className="cphone">
      <div className="chead">
        <span className="gb"><span className="gb-name">{current?.branch || ""}</span></span><span className="meta">vs</span>
        <button className="chip sm" aria-label="Compare against" onClick={actions.compareAgainst}>{base}</button>
        <span className="grow" />
        <span className="meta">{`${files.length} file${files.length === 1 ? "" : "s"}`}</span>
        {added ? <span className="add mono">{`+${added}`}</span> : null}
        {removed ? <span className="rem mono">{`−${removed}`}</span> : null}
      </div>
      {trees.length > 1 ? (
        <button className="cwt-toggle" aria-expanded={ui.wtOpen} onClick={() => patchChangesUi({ wtOpen: !ui.wtOpen })}>
          <span className="meta">Worktree</span><span className="grow trunc mono">{current?.branch || ""}</span><span className="meta">{ui.wtOpen ? "▴" : "▾"}</span>
        </button>
      ) : null}
      {ui.wtOpen ? (
        <div className="cwt-open">
          <WorktreeList trees={trees} mainTree={c.mainTree} current={current} path={c.path} confirm={ui.confirm} machine={c.machine} actions={actions} />
        </div>
      ) : null}
      {files.length ? (
        <div className="cfl">
          {files.map((f) => {
            const [dir, name] = split(f.path);
            return (
              <button key={f.path} className="cfr" onClick={() => patchChangesUi({ file: f.path, stage: "diff" })}>
                <span className={"cs " + (f.status || "M")}>{f.status || "M"}</span>
                <span className="grow cfn"><span className="trunc cfb">{name}</span><span className="trunc meta mono">{dir || "/"}</span></span>
                <span className="add mono">{`+${f.added || 0}`}</span>
                {f.removed ? <span className="rem mono">{`−${f.removed}`}</span> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="cempty"><div className="cempty-t">Nothing to commit</div><div className="meta">{`No changes compared with ${base}.`}</div></div>
      )}
      <div className="cbar">
        <button className="btn" disabled={!files.length} onClick={() => actions.run("Commit…", actions.commit)}>Commit…</button>
        <button className="btn pri" onClick={() => actions.run("Push & open PR", actions.pushPr)}>Push &amp; open PR</button>
        <button className="btn cmore" aria-label="More actions" onClick={() => openChangesSheet(c)}>⋯</button>
      </div>
    </div>
  );
}

export function ChangesPhone({ c }: { c: ChangesCtx }) {
  const diffOk = c.ui.stage === "diff" && c.files.some((f) => f.path === c.ui.file); // the file may no longer be changed
  return diffOk ? <DiffScreen c={c} /> : <ListScreen c={c} />;
}
