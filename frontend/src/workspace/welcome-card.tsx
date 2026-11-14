import { allActions } from "../actions/build-actions";

export function WelcomeCard() {
  return (
    <div className="welcome">
      <div className="card">
        <h1>Start an agent</h1>
        <p>Pick a folder and an agent. It keeps running in herd-server even when you close this window.</p>
        <div className="row">
          <button className="btn pri" onClick={() => allActions.newAgent()}>New agent</button>
          <button className="btn" onClick={() => allActions.newSpace(null)}>Open folder</button>
        </div>
        <p className="meta">Shortcuts: Ctrl+A then ? for the full list.</p>
      </div>
    </div>
  );
}
