// Top bar for the full-page views (Inbox, Machines, ...): title + hint left, per-view actions right.
import { allActions } from "../actions/build-actions";
import { useStore } from "../core/store";
import { Icon } from "../ui/atoms/icon";
import { VIEW_TITLES } from "./shell-logic";
import { useTopExtra } from "./top-extra-store";

export function TopbarViewBar({ view }: { view: string }) {
  const [title, hint] = VIEW_TITLES[view] || [""];
  const extra = useTopExtra((s) => (s.view === view ? s : null));
  const spaceName = useStore((s) => (s.ui.spaceId ? s.spaceById.get(s.ui.spaceId)?.name : "") || "");
  const files = view === "files";
  return (
    <>
      <button className={"pb" + (files ? "" : " mobile-only")} onClick={() => allActions.show("workspace")} aria-label="Back to terminals">
        <Icon name="back" />Terminals
      </button>
      <span className="title">{title ?? spaceName}</span>
      {hint ? <span className="meta desk">{hint}</span> : null}
      <span className="desk row">{extra?.meta}</span>
      <span className="grow" />
      {view === "changes" ? (
        <div className="desk row" style={{ gap: 2 }}>
          {([["files", "Files"], ["changes", "Changes"]] as const).map(([v, label]) => (
            <button key={v} className={"pb" + (view === v ? " on" : "")} onClick={() => allActions.show(v)}>{label}</button>
          ))}
        </div>
      ) : files ? <span className="meta desk">Ctrl+Shift+E · refreshes every 3 s while agents edit</span> : null}
      <span className="desk row">{extra?.right}</span>
    </>
  );
}
