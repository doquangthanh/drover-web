// What the user can do with a chat: open, create, send, stop, answer a permission question, rename, delete.
import { confirmBox, promptText } from "../overlays/modal-dialogs";
import { conn } from "../core/connection";
import { rpc, rpcQuiet, setUi, ui } from "../actions/action-helpers";
import { renameInPlace } from "../core/inline-rename-store";
import type { ChatImage, ChatItem, ChatOptions, PermissionMode } from "./chat-types";
import { useChats } from "./chat-store";

export async function loadHistory(chatId: string): Promise<void> {
  const r = await rpcQuiet<{ items: ChatItem[] }>("chat.history", { chat: chatId });
  if (r) useChats.getState().setHistory(chatId, r.items);
}

const loading = new Set<string>();

/** Slash commands and models of this chat's agent. The first call starts the agent (about a second); later ones are instant. */
export async function loadOptions(chatId: string): Promise<void> {
  if (useChats.getState().options[chatId] || loading.has(chatId)) return;
  loading.add(chatId);
  try {
    useChats.getState().setOptions(chatId, await conn.rpc<ChatOptions>("chat.options", { chat: chatId }));
  } catch { /* the pickers just stay on their built-in lists; a real failure shows when a message is sent */ } finally { loading.delete(chatId); }
}

/** Project files for the @ picker. Resolves to [] on any failure: suggestions must never get in the way of typing. */
export async function searchFiles(chatId: string, query: string): Promise<string[]> {
  try { return (await conn.rpc<{ files: string[] }>("chat.files", { chat: chatId, query })).files; } catch { return []; }
}

function openChat(chatId: string): void {
  setUi({ view: "chat", chatId, mobilePane: null });
}

async function newChat(o: { cwd: string; name?: string; spaceId?: string | null; prompt?: string; mode?: PermissionMode }): Promise<void> {
  const chat = await rpc<{ id: string }>("chat.create", { cwd: o.cwd, name: o.name || undefined, space: o.spaceId || undefined, permission_mode: o.mode });
  openChat(chat.id);
  const text = o.prompt?.trim();
  if (text) await rpcQuiet("chat.send", { chat: chat.id, text });
}

async function renameChat(chatId: string): Promise<void> {
  const chat = useChats.getState().chats.find((c) => c.id === chatId);
  if (!chat || renameInPlace(`chat:${chatId}`, "#sidebar")) return;
  const name = await promptText("Rename chat", chat.name);
  if (name) rpcQuiet("chat.rename", { chat: chatId, name });
}

async function removeChat(chatId: string): Promise<void> {
  const chat = useChats.getState().chats.find((c) => c.id === chatId);
  if (!chat || !(await confirmBox(`Delete ${chat.name}?`, "Its messages are removed. Your project files are not touched.", "Delete", true))) return;
  await rpcQuiet("chat.remove", { chat: chatId });
  if (ui().chatId === chatId) setUi({ view: "workspace", chatId: null });
}

export const chatActions = {
  openChat,
  newChat,
  renameChat,
  removeChat,
  setChatName: (chatId: string, name: string) => { rpcQuiet("chat.rename", { chat: chatId, name }); },
  sendChat: (chatId: string, text: string, images: ChatImage[]) => rpc("chat.send", { chat: chatId, text, images }),
  stopChat: (chatId: string) => { rpcQuiet("chat.interrupt", { chat: chatId }); },
  answerPermission: (chatId: string, request: string, allow: boolean, always = false) => { rpcQuiet("chat.answer", { chat: chatId, request, allow, always }); },
  setChatModel: (chatId: string, model: string) => { rpcQuiet("chat.set_model", { chat: chatId, model }); },
  setChatMode: (chatId: string, mode: PermissionMode) => { rpcQuiet("chat.set_mode", { chat: chatId, permission_mode: mode }); },
};
