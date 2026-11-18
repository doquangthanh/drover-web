// Same surface as pywebview's `window.pywebview.api`, so the React UI needs no change in the Tauri window.
(() => {
  const invoke = (cmd, args) => window.__TAURI_INTERNALS__.invoke(cmd, args || {});
  window.pywebview = {
    api: {
      pick_folder: (start) => invoke("pick_folder", { start: start || "" }),
      open_path: (path) => invoke("open_path", { path }),
      platform: () => invoke("platform"),
      set_dark_title: (dark) => invoke("set_dark_title", { dark: !!dark }),
    },
  };
  const ready = () => window.dispatchEvent(new Event("pywebviewready"));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
