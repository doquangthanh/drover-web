// What the daemon sends for chats (see src/drover/chat/transcript_builder.py for the item contract).
export type PermissionMode = "default" | "acceptEdits" | "plan" | "bypassPermissions";
export type ChatState = "idle" | "working" | "blocked";

export interface Chat {
  id: string;
  name: string;
  cwd: string;
  space_id?: string | null;
  state: ChatState;
  permission_mode: PermissionMode;
  model?: string | null;
  updated_at: number;
}

export interface ChatCommand { name: string; description: string; hint: string }
export interface ChatModel { value: string; label: string; description: string }
export interface ChatOptions { commands: ChatCommand[]; models: ChatModel[] }

export interface ChatImage { media_type: string; data: string }

interface Base { id: string; parent?: string }
export interface UserItem extends Base { kind: "user"; text: string; images: ChatImage[] }
export interface TextItem extends Base { kind: "text"; text: string; live?: boolean }
export interface ThinkingItem extends Base { kind: "thinking"; text: string; live?: boolean }
export interface ToolItem extends Base {
  kind: "tool"; name: string; input: Record<string, unknown>;
  status: "running" | "done" | "error" | "stopped"; result: string | null; is_error: boolean;
}
export interface PermissionItem extends Base {
  kind: "permission"; tool: string; input: Record<string, unknown>; status: "pending" | "allowed" | "denied";
  title?: string | null; detail?: string | null;
}
export interface ResultItem extends Base { kind: "result"; ok: boolean; ms: number; cost: number | null; turns: number; error: string | null }
export interface NoticeItem extends Base { kind: "notice"; text: string; level: "info" | "error" }

export type ChatItem = UserItem | TextItem | ThinkingItem | ToolItem | PermissionItem | ResultItem | NoticeItem;

export type ChatOp =
  | { chat: string; op: "item"; item: ChatItem }
  | { chat: string; op: "delta"; id: string; text: string };

export const MODE_LABELS: Record<PermissionMode, string> = {
  default: "Ask before changes", acceptEdits: "Edit automatically", plan: "Plan only", bypassPermissions: "Full access",
};
