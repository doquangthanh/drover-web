// Assembles every user action (buttons, palette, shortcuts) under the names keys.ts / the event router call.
import { registerActions, type Actions } from "../core/keys";
import { paneActions } from "./pane-actions";
import { tabSpaceActions } from "./tab-space-actions";
import { viewActions } from "./view-actions";

export const allActions = { ...viewActions, ...tabSpaceActions, ...paneActions };

export function installActions(): Actions {
  registerActions(allActions as Actions);
  return allActions as Actions;
}
