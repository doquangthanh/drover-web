// Minimal typing of the vendored Ace API this app uses (global `window.ace`, injected lazily).
export interface AceUndoManager { markClean(): void; isClean(): boolean; reset(): void }
export interface AceSession {
  setUseWorker(on: boolean): void;
  setNewLineMode(mode: string): void;
  getUndoManager(): AceUndoManager;
  on(event: "change", fn: () => void): void;
  getValue(): string;
  setValue(text: string): void;
  getScrollTop(): number;
  setScrollTop(top: number): void;
  addGutterDecoration(row: number, className: string): void;
  removeGutterDecoration(row: number, className: string): void;
}
export interface AceEditor {
  renderer: { setScrollMargin(top: number, bottom: number): void };
  commands: { addCommand(cmd: { name: string; bindKey: { win: string; mac: string }; exec: () => void }): void };
  setTheme(theme: string): void;
  setSession(session: AceSession): void;
  setReadOnly(on: boolean): void;
  resize(force?: boolean): void;
  /** `column` is 0-based. Scrolls the line to the middle of the view. */
  gotoLine(line: number, column?: number, animate?: boolean): void;
  getSelectedText(): string;
  /** Rows are 0-based. */
  getSelectionRange(): { start: { row: number }; end: { row: number; column: number } };
  isFocused(): boolean;
  focus(): void;
}
export interface AceStatic {
  config: { set(key: string, value: string): void };
  edit(el: HTMLElement, options: Record<string, unknown>): AceEditor;
  createEditSession(text: string, mode: string): AceSession;
}

declare global {
  interface Window { ace?: AceStatic }
}
