import { setFeatureHooks } from "../actions/feature-hooks";
import { useStore } from "../core/store";
import { copySelection, focusTerminal, watchPaneIds } from "../terminals/terminal-registry";

setFeatureHooks({ focusTerminal, copySelection });
watchPaneIds();
// Coming back to the window: type straight into the focused terminal.
window.addEventListener("focus", () => focusTerminal(useStore.getState().ui.focusedPane));
