//! Before any window: `drover <args>` is `dr <args>` (installs up to 0.1.4x run `drover.exe server run ...` from
//! their autostart and `dr.cmd` shims), and a `drover` started outside a release folder (the downloaded
//! drover.exe) installs that folder first and runs from it. Same code on every OS.

use std::ffi::OsString;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use drover_daemon::self_update::version_tuple;
use drover_daemon::self_update_apply::{VERSION_FILE, default_app_dir, install_release, is_bundle, tag_ok};

const EXE: &str = if cfg!(windows) { ".exe" } else { "" };

/// Returns when this process should open the window; otherwise it runs the right program and exits.
pub fn hand_over_if_needed() {
    let args: Vec<OsString> = std::env::args_os().skip(1).collect();
    let window_only = args.is_empty() || (args.len() == 1 && args[0] == "app");
    let here = std::env::current_exe().ok().and_then(|e| e.parent().map(Path::to_path_buf));
    if let Some(here) = here.filter(|d| is_bundle(d)) {
        if !window_only {
            std::process::exit(forward(&here.join(format!("dr{EXE}")), &args));
        }
        return;
    }
    // This program's own version: drover-web is bumped to the release tag. drover-core's VERSION comes from its
    // pyproject.toml, which only its own CI stamps, so built here it named a release (v0.1.5) with no bundle: 404.
    let tag = format!("v{}", env!("CARGO_PKG_VERSION"));
    // Only the release workflows set DROVER_RELEASE: a local `cargo build` just opens the window.
    if option_env!("DROVER_RELEASE").is_none() || !tag_ok(&tag) {
        return;
    }
    let app = default_app_dir();
    remove_replaced_copies();
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
    std::process::exit(forward(&target, &args));
}

/// Run `program args` for the caller. `server run` is the daemon, which runs until stopped: start it and return,
/// or this launcher (and the bundle's drover.exe it went through) would sit in memory waiting for it.
fn forward(program: &PathBuf, args: &[OsString]) -> i32 {
    if args.len() >= 2 && args[0] == "server" && args[1] == "run" {
        let mut cmd = Command::new(program);
        cmd.args(args).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
        #[cfg(windows)]
        std::os::windows::process::CommandExt::creation_flags(&mut cmd, 0x0800_0000 | 0x0000_0200); // no console, new group
        #[cfg(unix)]
        std::os::unix::process::CommandExt::process_group(&mut cmd, 0);
        return match cmd.spawn() {
            Ok(_) => 0,
            Err(e) => {
                show_error(&format!("could not start {}: {e}", program.display()));
                1
            }
        };
    }
    run_and_wait(program, args)
}

/// `drover.exe.old`, `.old2`...: the one-file drover.exe that the 0.1.4x updater swapped out for this one. That
/// Python app cleaned them on its next start; it never starts again, so do it here (best effort: one still running
/// stays until the next launch).
fn remove_replaced_copies() {
    let Ok(exe) = std::env::current_exe() else { return };
    let (Some(dir), Some(name)) = (exe.parent(), exe.file_name()) else { return };
    let prefix = format!("{}.old", name.to_string_lossy());
    for entry in std::fs::read_dir(dir).into_iter().flatten().flatten() {
        if entry.file_name().to_string_lossy().starts_with(&prefix) {
            let _ = std::fs::remove_file(entry.path());
        }
    }
}

/// Install this release into `app` unless it already holds it or a newer one (it updates itself).
fn install_if_older(app: &Path, tag: &str) -> Result<(), String> {
    let have = std::fs::read_to_string(app.join(VERSION_FILE)).unwrap_or_default();
    if is_bundle(app) && version_tuple(&have) >= version_tuple(tag) {
        return Ok(());
    }
    tauri::async_runtime::block_on(install_release(app, tag))?;
    add_to_start_menu(app);
    Ok(())
}

/// Windows: a Start menu entry for the installed window (Linux: install.sh writes the .desktop entry).
fn add_to_start_menu(app: &Path) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let Some(roaming) = std::env::var_os("APPDATA") else { return };
        let link = Path::new(&roaming).join(r"Microsoft\Windows\Start Menu\Programs\Drover.lnk");
        // Paths go in through the environment, never into the script text.
        let script = "$s = (New-Object -ComObject WScript.Shell).CreateShortcut($env:DROVER_LNK); \
                      $s.TargetPath = $env:DROVER_EXE; $s.WorkingDirectory = $env:DROVER_DIR; $s.Save()";
        let _ = Command::new("powershell").args(["-NoProfile", "-NonInteractive", "-Command", script])
            .env("DROVER_LNK", link).env("DROVER_EXE", app.join("drover.exe")).env("DROVER_DIR", app)
            .creation_flags(0x0800_0000) // CREATE_NO_WINDOW
            .status();
    }
    #[cfg(not(windows))]
    let _ = app;
}

fn run_and_wait(program: &PathBuf, args: &[OsString]) -> i32 {
    let mut cmd = Command::new(program);
    cmd.args(args);
    // This is a window app: a console program it starts (dr.exe) would get a console window of its own.
    #[cfg(windows)]
    std::os::windows::process::CommandExt::creation_flags(&mut cmd, 0x0800_0000); // CREATE_NO_WINDOW
    match cmd.status() {
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
