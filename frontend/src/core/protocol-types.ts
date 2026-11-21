// Wire shapes of the drover daemon (`combined_state()` + /ws messages). Fields are optional where the daemon may omit them.

export type PaneState = "blocked" | "done" | "working" | "idle" | "exited" | string;

export interface Pane {
  id: string;
  name?: string;
  title?: string;
  command?: string;
  kind?: string;
  state: PaneState;
  unread?: boolean;
  exit_code?: number | null;
  cwd?: string;
  since?: number;
  created_at?: number;
  space_id?: string;
  tab_id?: string;
  machine?: string;
  /** Display text an agent reported with OSC 7501 `summary=`. */
  summary?: string;
}

export type LayoutNode =
  | { pane: string; a?: undefined; b?: undefined }
  | { split?: "row" | "col"; ratio?: number; a: LayoutNode; b: LayoutNode; pane?: undefined };

export interface Tab {
  id: string;
  name?: string;
  space_id: string;
  layout?: LayoutNode | null;
  focused?: string | null;
  zoomed?: boolean;
  machine?: string;
}

export interface Space {
  id: string;
  name?: string;
  color?: number;
  cwd?: string;
  branch?: string;
  dirty?: number;
  ahead?: number;
  machine?: string;
}

export interface StoppedPane { id: string; [k: string]: unknown }

export interface Snapshot {
  spaces?: Space[];
  tabs?: Tab[];
  panes?: Pane[];
  stopped?: StoppedPane[];
}

export interface Machine {
  alias: string;
  status?: string;
  error?: string | null;
  latency_ms?: number | null;
  snapshot?: Snapshot | null;
  [k: string]: unknown;
}

export interface RawState extends Snapshot {
  machines?: Machine[];
  policy_pending?: unknown[];
  prefix?: string;
  theme?: string;
  file_icons?: string;
  terminal_font?: { family?: string; size?: number };
  [k: string]: unknown;
}

export interface StatusEvent { pane: Pane; new?: string; old?: string }

/** Messages the daemon sends over /ws. */
export type ServerMessage =
  | { t: "res"; id: number; result?: unknown; error?: { message: string; code?: string | number } }
  | { t: "ev"; name: string; data: unknown }
  | { t: "out" | "replay"; pane: string; data: string };
