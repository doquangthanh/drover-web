// Under a pane header once its agent is done: one obvious next step, the diff of what it changed.
import { useState } from "react";
import { allActions } from "../actions/build-actions";
import { useStore } from "../core/store";

/** Open the Changes view for the space this pane belongs to. */
export function reviewPane(paneId: string): void {
  const s = useStore.getState();
  const spaceId = s.paneById.get(paneId)?.space_id;
  if (spaceId) s.setUi({ spaceId });
  allActions.show("changes");
}

export function ReviewBanner({ paneId }: { paneId: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="rbanner">
      <span className="dot done" />
      <span className="grow">Finished. Look over what it changed.</span>
      <button className="btn sm pri" onClick={() => reviewPane(paneId)}>Review changes</button>
      <span className="k">Ctrl+Shift+G</span>
      <button className="ibtn" aria-label="Dismiss" title="Dismiss" onClick={() => setHidden(true)}>✕</button>
    </div>
  );
}
