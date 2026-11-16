import { allActions } from "../actions/build-actions";

export function WelcomeCard() {
  return (
    <div className="welcome">
      <div className="card">
        <h1>New space</h1>
        <p>Opens a terminal. Run claude, codex or any agent in it and it shows up in the sidebar. It keeps running in drover-server even when you close this window.</p>
        <div className="row">
          <button className="btn pri" onClick={() => allActions.newSpace(null)}>New space</button>
        </div>
        <p className="meta">Shortcuts: Ctrl+A then ? for the full list.</p>
      </div>
    </div>
  );
}
