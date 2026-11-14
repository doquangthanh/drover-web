// The desktop window (pywebview) injects `window.pywebview.api`; absent in a normal browser.
export {};

declare global {
  interface Window {
    pywebview?: { api?: { pick_folder?: (start: string) => Promise<string | null> } };
  }
}
