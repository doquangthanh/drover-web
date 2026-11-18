"""`dr app` in the Linux release bundle: open the Rust (Tauri) window `drover` that ships next to `dr`.

It needs the system WebKitGTK; when that is missing the program dies at once, and the caller falls back to the
web UI in the browser (the Python launcher, which has no Qt in the hybrid bundle).
"""

from __future__ import annotations

import os
import subprocess
import sys

from drover.self_command import bundle_dir, is_frozen


def open_bundled_window() -> bool:
    """True when the Rust window is running (or a running one was focused); False: no window, use a fallback."""
    if not is_frozen() or sys.platform == "win32":
        return False
    exe = bundle_dir() / "drover"
    if not (exe.is_file() and os.access(exe, os.X_OK)):
        return False
    proc = subprocess.Popen([str(exe), "app"], stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        return proc.wait(timeout=2) == 0  # exits 0 at once when it only focused the window already open
    except subprocess.TimeoutExpired:
        return True  # still running: the window is up
