"""`drover` / `dr app`: native window around the daemon's web UI.

Closing the window never stops agents — they live in the daemon.
"""

from __future__ import annotations

import os
import subprocess
import sys
import time

from drover.daemon.daemon_client import DaemonUnavailable, ensure_daemon, is_alive, read_info, ui_url


class DesktopBridge:
    """Exposed to the page as `window.pywebview.api` — only harmless, user-initiated actions."""

    def __init__(self) -> None:
        self._window = None

    def pick_folder(self, start: str = "") -> str | None:
        import webview

        start_dir = start if start and os.path.isdir(start) else os.path.expanduser("~")
        result = self._window.create_file_dialog(webview.FileDialog.FOLDER, directory=start_dir)
        if not result:
            return None
        return result[0] if isinstance(result, (list, tuple)) else str(result)

    def open_path(self, path: str) -> bool:
        """Open a config file/folder in the system's default app."""
        from drover.app_paths import config_dir

        real = os.path.realpath(path)
        allowed = os.path.realpath(str(config_dir()))
        if not (real == allowed or real.startswith(allowed + os.sep)):
            return False
        if sys.platform == "win32":
            os.startfile(real)
        elif sys.platform == "darwin":
            subprocess.Popen(["open", real])
        else:
            subprocess.Popen(["xdg-open", real])
        return True

    def platform(self) -> str:
        return sys.platform

    def set_dark_title(self, dark: bool) -> None:
        """Called by the page whenever the app theme changes, so the native title bar matches."""
        style_title_bar(self._window, bool(dark))


def title_bar_linux(window, dark: bool) -> None:
    """Qt window on Linux: Wayland draws the frame client-side (follows Qt colour scheme, Qt >= 6.8);
    X11/GNOME draws it server-side and honours the _GTK_THEME_VARIANT hint."""
    import contextlib
    import shutil

    with contextlib.suppress(Exception):  # older Qt has no setColorScheme; the X11 hint below may still work
        from qtpy.QtCore import Qt
        from qtpy.QtWidgets import QApplication

        QApplication.styleHints().setColorScheme(Qt.ColorScheme.Dark if dark else Qt.ColorScheme.Light)
    with contextlib.suppress(Exception):  # cosmetic only
        native = getattr(window, "native", None)
        if native is not None and shutil.which("xprop") and os.environ.get("DISPLAY"):
            subprocess.run(
                ["xprop", "-id", str(int(native.winId())), "-f", "_GTK_THEME_VARIANT", "8u",
                 "-set", "_GTK_THEME_VARIANT", "dark" if dark else "light"],
                check=False, timeout=5, capture_output=True,
            )


def style_title_bar(window, dark: bool = True) -> None:
    """The default title bar is bright white on top of a dark UI. Follows the app theme (dark=False: system default).
    Windows 10 1809+/11: dark caption, Windows 11: UI colours."""
    if sys.platform == "linux":
        title_bar_linux(window, dark)
    if sys.platform != "win32":
        return
    import ctypes

    hwnd = ctypes.windll.user32.FindWindowW(None, window.title)
    if not hwnd:
        return
    dwm = ctypes.windll.dwmapi

    def set_attr(attr: int, value: int) -> None:
        v = ctypes.c_int(value)
        dwm.DwmSetWindowAttribute(hwnd, attr, ctypes.byref(v), ctypes.sizeof(v))  # unsupported attrs just fail

    default = 0xFFFFFFFF  # DWMWA_COLOR_DEFAULT
    set_attr(20, 1 if dark else 0)               # DWMWA_USE_IMMERSIVE_DARK_MODE
    set_attr(35, 0x181513 if dark else default)  # DWMWA_CAPTION_COLOR  (COLORREF 0x00BBGGRR of #131518)
    set_attr(34, 0x181513 if dark else default)  # DWMWA_BORDER_COLOR
    set_attr(36, 0xE8E6E4 if dark else default)  # DWMWA_TEXT_COLOR


def follow_daemon(window, loaded_url: str) -> None:
    """Restarting the server changes its port and token; point the open window at the new one.

    Without this the page retries the dead address forever ("reconnecting...").
    """
    while True:
        time.sleep(1.5)
        info = read_info()
        if not info:
            continue
        url = ui_url(info)
        if url != loaded_url and is_alive(info):
            loaded_url = url
            try:
                window.load_url(url)
            except Exception:  # noqa: BLE001 - pywebview raises assorted errors while the window closes
                return


def log_stderr_to_file() -> None:
    """Started from a menu there is no terminal, so crashes (even Qt aborts) would vanish: keep them in app.log."""
    if sys.platform == "win32" or sys.stderr is None or sys.stderr.isatty():
        return
    from drover.app_paths import config_dir

    try:
        log = open(config_dir() / "app.log", "a", buffering=1, encoding="utf-8")  # noqa: SIM115 - lives as long as the process
        os.dup2(log.fileno(), 2)  # fd 2 too, so native (Qt) messages land here as well
        sys.stderr = log
    except OSError:
        pass


def xcb_cursor_available() -> bool:
    """Qt >= 6.5 aborts the whole process (uncatchable) when libxcb-cursor is missing, so test for it first."""
    import ctypes

    try:
        ctypes.CDLL("libxcb-cursor.so.0")
        return True
    except OSError:
        return False


def main() -> None:
    log_stderr_to_file()
    try:
        info = ensure_daemon()
    except DaemonUnavailable as exc:
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(10)
    url = ui_url(info)
    try:
        import webview
    except ImportError:
        import webbrowser

        webbrowser.open(url)
        return
    if sys.platform == "linux" and not xcb_cursor_available():
        import webbrowser

        print(
            "native window needs libxcb-cursor0 (Debian/Ubuntu: sudo apt install libxcb-cursor0); "
            f"opening {url} in the browser",
            file=sys.stderr,
        )
        webbrowser.open(url)
        return
    if sys.platform == "win32":
        import ctypes

        # Own taskbar identity: without it Windows can show a blank-page icon for the window's taskbar button.
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("Drover.Desktop")
    bridge = DesktopBridge()
    bridge._window = webview.create_window(
        " ", url, js_api=bridge, width=1440, height=900, min_size=(360, 480), background_color="#131518"
    )
    from drover.app_paths import web_static_dir

    icon = web_static_dir() / ("app-icon.ico" if sys.platform == "win32" else "favicon.png")  # WinForms needs .ico
    bridge._window.events.shown += lambda: style_title_bar(bridge._window)
    gui = "qt" if sys.platform == "linux" else None  # Linux builds bundle Qt WebEngine; don't probe for system GTK
    try:
        webview.start(
            follow_daemon, (bridge._window, url), gui=gui, private_mode=False, icon=str(icon) if icon.exists() else None
        )
    except Exception as exc:  # noqa: BLE001 - no usable native window: the web UI still works in a browser
        import webbrowser

        print(f"no native window ({exc}); opening {url} in the browser", file=sys.stderr)
        webbrowser.open(url)


if __name__ == "__main__":
    main()
