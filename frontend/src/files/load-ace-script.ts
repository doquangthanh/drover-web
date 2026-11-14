// Ace is vendored (served at /static/vendor/ace/) and only injected when the first file is opened.
import type { AceStatic } from "./ace";

const SRC = "/static/vendor/ace/ace.js";
let loading: Promise<AceStatic> | null = null;

/** Idempotent: one script tag, one promise. A failed load can be retried by calling again. */
export function loadAce(): Promise<AceStatic> {
  if (window.ace) return Promise.resolve(window.ace);
  loading ??= new Promise<AceStatic>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SRC;
    script.onload = () => (window.ace ? resolve(window.ace) : reject(new Error("The code editor did not initialise")));
    script.onerror = () => { loading = null; script.remove(); reject(new Error("Could not load the code editor")); };
    document.head.appendChild(script);
  });
  return loading;
}
