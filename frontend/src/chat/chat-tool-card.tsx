// One tool call: a header (what it did, whether it worked) that opens to show the changes, the input and the output.
import { useState } from "react";
import { diffCounts, editDiff, toolSummary, type DiffLine } from "./chat-logic";
import type { ToolItem } from "./chat-types";

export function DiffView({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="diff-box">
      {lines.slice(0, 400).map((l, i) => <div key={i} className={`dl ${l.sign === "+" ? "add" : l.sign === "-" ? "del" : ""}`}>{l.sign} {l.text}</div>)}
      {lines.length > 400 ? <div className="dl more">… {lines.length - 400} more lines</div> : null}
    </div>
  );
}

function StatusIcon({ status }: { status: ToolItem["status"] }) {
  if (status === "running") return <span className="spin" title="running" />;
  if (status === "error") return <span className="tc-mark bad" title="failed">!</span>;
  if (status === "stopped") return <span className="tc-mark" title="stopped">■</span>;
  return <span className="tc-mark ok" title="done">✓</span>;
}

export function ToolCard({ item }: { item: ToolItem }) {
  const diff = editDiff(item.name, item.input);
  const [open, setOpen] = useState(!!diff && item.name !== "Write"); // edits show their change right away
  const counts = diff ? diffCounts(diff) : null;
  const summary = toolSummary(item.name, item.input);
  const rest = Object.entries(item.input).filter(([k]) => !(diff && ["old_string", "new_string", "content", "edits"].includes(k)));
  return (
    <div className={`tool-card ${item.status}` + (item.parent ? " sub" : "")}>
      <button className="tc-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <StatusIcon status={item.status} />
        <span className="tc-name">{item.name}</span>
        <span className="tc-sum trunc">{summary}</span>
        {counts ? <span className="tc-counts"><span className="add">+{counts.added}</span> <span className="rem">−{counts.removed}</span></span> : null}
        <span className="tc-caret">{open ? "▾" : "▸"}</span>
      </button>
      {open ? (
        <div className="tc-body">
          {diff ? <DiffView lines={diff} /> : null}
          {rest.length ? (
            <div className="tc-input">
              {rest.map(([k, v]) => <div key={k}><span className="k">{k}</span> <span className="v">{typeof v === "string" ? v : JSON.stringify(v)}</span></div>)}
            </div>
          ) : null}
          {item.result ? <pre className={"tc-out" + (item.is_error ? " bad" : "")}>{item.result}</pre> : null}
          {item.status === "running" ? <div className="meta">Running…</div> : null}
        </div>
      ) : null}
    </div>
  );
}
