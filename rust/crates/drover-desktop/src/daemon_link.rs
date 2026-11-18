//! Find or start the daemon, and keep the window pointed at it. Ports of `daemon_client.ensure_daemon` and
//! `desktop_window_launcher.follow_daemon`. Works with either daemon (Python or Rust): only daemon.json and /health.

use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use drover_daemon::{is_alive, read_info};
use serde_json::Value;

pub fn ui_url(info: &Value) -> Option<String> {
    let port = info["port"].as_u64()?;
    let token = info["token"].as_str()?;
    Some(format!("http://127.0.0.1:{port}/?token={token}"))
}

/// The daemon next to this executable: `drover-server` (release bundle), else `dr` (dev build dir), else `dr` on PATH.
fn dr_binary() -> PathBuf {
    let exe = |n: &str| if cfg!(windows) { format!("{n}.exe") } else { n.to_string() };
    let dir = std::env::current_exe().ok().and_then(|p| p.parent().map(PathBuf::from));
    ["drover-server", "dr"].iter()
        .find_map(|n| dir.as_ref().map(|d| d.join(exe(n))).filter(|p| p.is_file()))
        .unwrap_or_else(|| PathBuf::from(exe("dr")))
}

fn start_background() -> std::io::Result<()> {
    let mut cmd = Command::new(dr_binary());
    cmd.args(["server", "run", "--background"]).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    #[cfg(unix)]
    std::os::unix::process::CommandExt::process_group(&mut cmd, 0); // closing the window must not stop the agents
    #[cfg(windows)]
    std::os::windows::process::CommandExt::creation_flags(&mut cmd, 0x0800_0000 | 0x0000_0200); // no console, new group
    cmd.spawn().map(|_| ())
}

/// Running daemon's info, starting one when none answers (15 s budget).
pub fn ensure_daemon() -> Result<Value, String> {
    if let Some(info) = read_info().filter(|i| is_alive(Some(i))) {
        return Ok(info);
    }
    start_background().map_err(|e| format!("cannot start the daemon ({}): {e}", dr_binary().display()))?;
    let deadline = Instant::now() + Duration::from_secs(15);
    while Instant::now() < deadline {
        if let Some(info) = read_info().filter(|i| is_alive(Some(i))) {
            return Ok(info);
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    Err("the daemon did not start within 15 s (see the daemon log in the state folder)".into())
}

/// Restarting the server changes its port and token; call `navigate` with the new address when it does.
/// Without this the page retries the dead address forever ("reconnecting...").
pub fn follow_daemon(mut loaded: String, navigate: impl Fn(&str) -> bool + Send + 'static) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(1500));
        let Some(info) = read_info() else { continue };
        let Some(url) = ui_url(&info) else { continue };
        if url != loaded && is_alive(Some(&info)) {
            if !navigate(&url) {
                return; // window is gone
            }
            loaded = url;
        }
    });
}

/// Only the daemon's own pages may load inside the window.
pub fn is_daemon_page(url: &tauri::Url) -> bool {
    let local_http = url.scheme() == "http" && matches!(url.host_str(), Some("127.0.0.1") | Some("localhost"));
    local_http || url.scheme() == "tauri" || url.as_str().starts_with("about:")
}
