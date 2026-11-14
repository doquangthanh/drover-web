// Registers the overlay entry points with the action layer (auto-imported by main.tsx).
import { setFeatureHooks } from "../actions/feature-hooks";
import { openBroadcast } from "./broadcast-dialog";
import { openPalette } from "./command-palette";
import { chooseFolder } from "./folder-picker-dialog";
import { openNewAgent } from "./new-agent-dialog";
import { openShortcuts } from "./shortcuts-dialog";
import { openSearch } from "./terminal-search";

setFeatureHooks({ openPalette, openSearch, openNewAgent, chooseFolder, openShortcuts, openBroadcast });
