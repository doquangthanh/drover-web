// Reads `[web_keys]` from keys.toml (through the daemon) and applies it. Called on connect and after Settings saves a file.
import { conn } from "./connection";
import { parseWebKeys, shadowedBuiltins } from "./keybindings";
import { builtinChords, getActions, setWebKeys } from "./keys";
import { toast } from "./toast-store";

export async function loadWebKeys(announce = false): Promise<void> {
  let text = "";
  try {
    const r = await conn.rpc<{ files: { name: string; text?: string }[] }>("settings.files", {});
    text = r.files.find((f) => f.name === "keys.toml")?.text ?? "";
  } catch { return; } // daemon too old or not reachable: keep the built-in keys
  const wk = parseWebKeys(text, new Set(Object.keys(getActions())));
  setWebKeys(wk);
  const notes = [...wk.problems, ...shadowedBuiltins(wk, builtinChords())];
  if (notes.length) toast("keys.toml [web_keys]: check these", notes[0] + (notes.length > 1 ? ` (+${notes.length - 1} more)` : ""));
  else if (announce) toast("Shortcuts reloaded", wk.byChord.size ? `${wk.byChord.size} custom` : "built-in keys only");
}
