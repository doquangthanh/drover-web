// Clipboard write shared by the terminal and the chat. The async API can be missing or refused in a webview, so fall back to execCommand.
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const box = document.createElement("textarea");
    box.value = text;
    box.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(box);
    box.select();
    try { return document.execCommand("copy"); } catch { return false; } finally { box.remove(); }
  }
}
