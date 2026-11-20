# drover-web

The browser UI of Drover (React + Vite, `frontend/`), its static files (`src/drover/web/`: icons, ace, favicon) and the
Tauri window that shows it (`rust/crates/drover-desktop`, binary `drover`).

It talks to the daemon of [drover-core](https://github.com/doquangthanh/drover-core) over `/ws` and `/rpc`.
drover-core serves the built UI from a folder: `DROVER_WEB_DIR` holds `web/` and `web_dist/`.

- Dev: `npm --prefix frontend ci && npm --prefix frontend run dev` (proxies to the running daemon).
- Build: `npm --prefix frontend run build` writes `src/drover/web_dist/`.
- Release: a `v*` tag publishes `drover-web-<tag>.tar.gz` (see `.github/workflows/release.yml`).
- Window: `cd rust && cargo build --release -p drover-desktop`. It depends on `drover-daemon` from drover-core at a git tag.
