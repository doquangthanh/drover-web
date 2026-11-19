//! Before any window: `drover <args>` is `dr <args>` (installs up to 0.1.4x run `drover.exe server run ...` from
//! their autostart and `dr.cmd` shims), and a `drover` started outside a release folder (the downloaded
//! drover.exe) installs that folder first and runs from it. Same code on every OS.

use std::ffi::OsString;
use std::path::{Path, PathBuf};
use std::process::Command;

use drover_daemon::self_update::{VERSION, version_tuple};
use drover_daemon::self_update_apply::{VERSION_FILE, default_app_dir, install_release, is_bundle, tag_ok};

const EXE: &str = if cfg!(windows) { ".exe" } else { "" };

/// Returns when this process should open the window; otherwise it runs the right program and exits.
pub fn hand_over_if_needed() {
    let args: Vec<OsString> = std::env::args_os().skip(1).collect();
    let window_only = args.is_empty() || (args.len() == 1 && args[0] == "app");
    let here = std::env::current_exe().ok().and_then(|e| e.parent().map(Path::to_path_buf));
    if let Some(here) = here.filter(|d| is_bundle(d)) {
        if !window_only {
            std::process::exit(run_and_wait(&here.join(format!("dr{EXE}")), &args));
        }
        return;
    }
    let tag = format!("v{VERSION}");
    // Only the release workflows set DROVER_RELEASE: a local `cargo build` just opens the window.
    if option_env!("DROVER_RELEASE").is_none() || !tag_ok(&tag) {
        return;
    }
    let app = default_app_dir();
    if let Err(e) = install_if_older(&app, &tag) {
        show_error(&format!("Drover could not install itself into {}:\n{e}", app.display()));
        if !is_bundle(&app) {
            std::process::exit(1);
        }
    }
    let target = app.join(format!("drover{EXE}"));
    if window_only {
        let spawned = Command::new(&target).spawn();
        std::process::exit(if spawned.is_ok() { 0 } else { 1 });
    }
    std::process::exit(run_and_wait(&target, &args));
}

/// Install this release into `app` unless it already holds it or a newer one (it updates itself).
fn install_if_older(app: &Path, tag: &str) -> Result<(), String> {
    let have = std::fs::read_to_string(app.join(VERSION_FILE)).unwrap_or_default();
    if is_bundle(app) && version_tuple(&have) >= version_tuple(tag) {
        return Ok(());
    }
    tauri::async_runtime::block_on(install_release(app, tag))
}

fn run_and_wait(program: &PathBuf, args: &[OsString]) -> i32 {
    match Command::new(program).args(args).status() {
        Ok(status) => status.code().unwrap_or(1),
        Err(e) => {
            show_error(&format!("could not run {}: {e}", program.display()));
            1
        }
    }
}

/// The window app has no console on Windows: say it in a message box there.
fn show_error(text: &str) {
    eprintln!("drover: {text}");
    #[cfg(windows)]
    {
        #[link(name = "user32")]
        unsafe extern "system" {
            fn MessageBoxW(hwnd: *mut std::ffi::c_void, text: *const u16, caption: *const u16, kind: u32) -> i32;
        }
        let wide = |s: &str| s.encode_utf16().chain([0]).collect::<Vec<u16>>();
        // SAFETY: both strings are NUL-terminated UTF-16 that live across the call; no owner window.
        unsafe {
            MessageBoxW(std::ptr::null_mut(), wide(text).as_ptr(), wide("Drover").as_ptr(), 0x10); // MB_ICONERROR
        }
    }
}
