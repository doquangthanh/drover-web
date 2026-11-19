//! `drover`: native window around the daemon's web UI (Tauri, system webview). Replaces the pywebview + PyQt
//! window. Closing the window never stops agents: they live in the daemon. A second `drover` focuses this window.

#![cfg_attr(windows, windows_subsystem = "windows")]

mod bridge_commands;
mod daemon_link;
mod launcher;

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

const WINDOW: &str = "main";

fn focus_main(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window(WINDOW) {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}

fn open_in_system_browser(url: &str) {
    let opener = if cfg!(windows) { "explorer" } else if cfg!(target_os = "macos") { "open" } else { "xdg-open" };
    let _ = std::process::Command::new(opener).arg(url).spawn();
}

fn main() {
    launcher::hand_over_if_needed();
    let info = match daemon_link::ensure_daemon() {
        Ok(info) => info,
        Err(e) => {
            eprintln!("error: {e}");
            std::process::exit(10);
        }
    };
    let Some(url) = daemon_link::ui_url(&info) else {
        eprintln!("error: daemon.json has no port/token");
        std::process::exit(10);
    };
    let result = tauri::Builder::default()
        // First plugin, so a second launch hands over to this process before anything else starts.
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| focus_main(app)))
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            bridge_commands::pick_folder,
            bridge_commands::open_path,
            bridge_commands::platform,
            bridge_commands::set_dark_title,
        ])
        .setup(move |app| {
            let external = url.parse().map_err(|e| format!("bad daemon url: {e}"))?;
            let window = WebviewWindowBuilder::new(app, WINDOW, WebviewUrl::External(external))
                .title("Drover")
                .inner_size(1440.0, 900.0)
                .min_inner_size(360.0, 480.0)
                .background_color(tauri::window::Color(0x13, 0x15, 0x18, 0xff))
                .initialization_script(include_str!("bridge.js"))
                .on_navigation(|target| {
                    if daemon_link::is_daemon_page(target) {
                        return true;
                    }
                    open_in_system_browser(target.as_str()); // links in terminals and docs open outside
                    false
                })
                .build()?;
            daemon_link::follow_daemon(url.clone(), move |next| {
                next.parse().is_ok_and(|u| window.navigate(u).is_ok())
            });
            Ok(())
        })
        .run(tauri::generate_context!());
    if let Err(e) = result {
        // No usable native window: the web UI still works in a browser.
        eprintln!("no native window ({e}); opening the UI in the browser");
        if let Some(u) = drover_daemon::read_info().as_ref().and_then(daemon_link::ui_url) {
            open_in_system_browser(&u);
        }
    }
}
