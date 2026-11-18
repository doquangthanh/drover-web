//! The four desktop actions the page may ask for (`window.pywebview.api` in `bridge.js`). Only harmless,
//! user-initiated actions: pick a folder, open a config file, report the platform, match the title bar theme.

use std::path::{Path, PathBuf};

use tauri::{AppHandle, Theme, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn pick_folder(app: AppHandle, start: String) -> Option<String> {
    let dir = if !start.is_empty() && Path::new(&start).is_dir() {
        PathBuf::from(start)
    } else {
        drover_daemon::fs_access::resolve(Path::new("~"))
    };
    // A blocking channel is fine: Tauri runs async commands off the main (UI) thread.
    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog().file().set_directory(dir).pick_folder(move |picked| {
        let _ = tx.send(picked.and_then(|p| p.into_path().ok()).map(|p| p.to_string_lossy().into_owned()));
    });
    rx.recv().ok().flatten()
}

/// Open a config file or folder in the system's default app; only inside the config folder.
#[tauri::command]
pub fn open_path(path: String) -> bool {
    let real = drover_daemon::fs_access::resolve(Path::new(&path));
    let allowed = drover_daemon::fs_access::resolve(&drover_daemon::paths::config_dir());
    if !real.starts_with(&allowed) {
        return false;
    }
    let opener = if cfg!(windows) { "explorer" } else if cfg!(target_os = "macos") { "open" } else { "xdg-open" };
    std::process::Command::new(opener).arg(&real).spawn().is_ok()
}

#[tauri::command]
pub fn platform() -> &'static str {
    if cfg!(windows) { "win32" } else if cfg!(target_os = "macos") { "darwin" } else { "linux" }
}

/// Called whenever the app theme changes, so the native title bar matches.
#[tauri::command]
pub fn set_dark_title(window: WebviewWindow, dark: bool) {
    let _ = window.set_theme(Some(if dark { Theme::Dark } else { Theme::Light }));
}
