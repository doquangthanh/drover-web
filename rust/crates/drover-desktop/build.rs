fn main() {
    // App commands the daemon page may call. Tauri 2 refuses app commands from a remote origin unless each one
    // has a permission that a capability grants (capabilities/daemon-ui.json).
    let commands = &["pick_folder", "open_path", "platform", "set_dark_title"];
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(commands)))
        .expect("tauri build");
}
