// WebKitGTK (the Tauri window on Linux) with ibus in its no-preedit mode (e.g. Vietnamese Telex) sends letters as
// keyup only, then commits each word as keydown(229) + input(insertFromComposition, data = the word) + compositionend,
// with no compositionstart. xterm's keydown(229) path then diffs its textarea wrongly and re-sends everything typed
// so far ("echo echo ..."). In WebKit (not Chromium) this module takes that path over: the 229 keydown is ignored,
// the input event's data is sent as is, and the orphan compositionend never reaches xterm.

/** True in WebKit engines (WebKitGTK, Safari); false in Chromium-based ones, which need none of this. */
export const webkitIme = /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg\//.test(navigator.userAgent);

export interface ImePrefix {
  /** True while the prefix (Ctrl+A) waits for its key. */
  pending: () => boolean;
  /** Run the prefix action for this key (the key the IME swallowed). */
  run: (key: string, shiftKey: boolean) => void;
}

/** Install on the terminal's container. `send` delivers committed text. The IME swallows the keydown of the key
 * pressed after the prefix, so that key is taken from wherever it shows up first:
 * - the IME commits it at once (punctuation such as `?`): first character of the commit;
 * - the IME holds it (Telex letters): its keyup. The IME context is then reset (blur + focus) before the action
 *   runs, so the action can move focus, and the held letter is dropped from the next commit.
 * Returns the keydown filter to put first in xterm's custom key handler (false = xterm must not handle the key). */
export function guardWebKitIme(el: HTMLElement, send: (data: string) => void, prefix: ImePrefix): (ev: KeyboardEvent) => boolean {
  let composing = false;
  let keydownSeen = new Set<string>();
  let dropFromNextCommit = "";
  el.addEventListener("compositionstart", () => { composing = true; }, true);
  el.addEventListener("compositionend", (e) => {
    if (!composing) e.stopPropagation();
    composing = false;
  }, true);
  el.addEventListener("input", (e) => {
    const ev = e as InputEvent;
    if (composing || ev.inputType !== "insertFromComposition" || !ev.data) return;
    e.stopPropagation();
    let data = ev.data;
    (e.target as HTMLTextAreaElement).value = "";
    if (dropFromNextCommit && data.startsWith(dropFromNextCommit)) data = data.slice(dropFromNextCommit.length);
    dropFromNextCommit = "";
    if (data && prefix.pending()) {
      const key = [...data][0];
      data = data.slice(key.length);
      prefix.run(key, key !== key.toLowerCase());
    }
    if (data) send(data);
  }, true);
  el.addEventListener("keydown", (e) => { keydownSeen.add(e.key); }, true);
  el.addEventListener("keyup", (e) => {
    const swallowed = e.key.length === 1 && !keydownSeen.has(e.key);
    keydownSeen.delete(e.key);
    if (!swallowed || !prefix.pending()) return;
    dropFromNextCommit = e.key;
    const box = e.target as HTMLTextAreaElement;
    box.blur(); // GTK resets the input method context on focus loss
    box.focus();
    prefix.run(e.key, e.shiftKey);
  }, true);
  el.addEventListener("blur", () => { keydownSeen = new Set(); }, true);
  return (ev) => !(ev.type === "keydown" && ev.keyCode === 229 && !composing);
}
