// Diff lines are rendered as React text nodes only (never innerHTML).
import { memo } from "react";
import { parseDiff } from "./diff-parse";

export const DiffView = memo(function DiffView({ text }: { text: string | null | undefined }) {
  const rows = parseDiff(text);
  if (!rows.length) return <div className="meta" style={{ padding: 14 }}>No changes in this file.</div>;
  return (
    <div className="diff">
      {rows.map((r, i) => (
        <div key={i} className={r.cls}>
          {r.n === undefined ? r.text : <><span className="ln">{r.n}</span>{r.text}</>}
        </div>
      ))}
    </div>
  );
});
