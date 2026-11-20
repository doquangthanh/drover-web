//! Which window `drover` opens. The GPUI window (`drover-native`, next to this program) is the default; this Tauri
//! web view is the fallback: when `DROVER_WINDOW=webview`, when there is no drover-native, or when it cannot start.

use std::path::PathBuf;
use std::process::{Command, Stdio};

const NATIVE: &str = if cfg!(windows) { "drover-native.exe" } else { "drover-native" };

/// `DROVER_WINDOW=webview` (or `tauri`) keeps the web view window.
fn webview_wanted() -> bool {
    std::env::var("DROVER_WINDOW").is_ok_and(|v| matches!(v.trim().to_ascii_lowercase().as_str(), "webview" | "tauri"))
}

fn native_path() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    Some(exe.parent()?.join(NATIVE)).filter(|p| p.is_file())
}

/// Start the GPUI window and exit when it is the one to open; return to open the web view instead.
/// The daemon must already be up: drover-native only connects to it.
pub fn open_native_unless_webview() {
    let window_only = std::env::args_os().skip(1).all(|a| a == "app");
    if !window_only || webview_wanted() {
        return;
    }
    let Some(native) = native_path() else { return };
    let mut cmd = Command::new(&native);
    cmd.stdin(Stdio::null());
    #[cfg(unix)]
    std::os::unix::process::CommandExt::process_group(&mut cmd, 0); // outlives this launcher
    match cmd.spawn() {
        Ok(_) => std::process::exit(0),
        Err(e) => eprintln!("cannot start {} ({e}); opening the web view window", native.display()),
    }
}
