// Chats and their transcripts. Live ops from the daemon are applied one by one; history is fetched when a chat is opened.
import { create } from "zustand";
import { appendDelta, mergeHistory, upsertItem } from "./chat-logic";
import type { Chat, ChatItem, ChatOp, ChatOptions } from "./chat-types";

interface ChatsState {
  chats: Chat[];
  items: Record<string, ChatItem[]>;
  loaded: Record<string, boolean>;
  options: Record<string, ChatOptions>;
  setChats(list: Chat[]): void;
  apply(op: ChatOp): void;
  setHistory(chatId: string, history: ChatItem[]): void;
  setOptions(chatId: string, options: ChatOptions): void;
}

export const NO_ITEMS: ChatItem[] = [];

export const useChats = create<ChatsState>((set) => ({
  chats: [],
  items: {},
  loaded: {},
  options: {},
  setChats: (chats) => set((s) => {
    const alive = new Set(chats.map((c) => c.id)); // forget transcripts of deleted chats
    const items = Object.fromEntries(Object.entries(s.items).filter(([id]) => alive.has(id)));
    return { chats, items };
  }),
  apply: (op) => set((s) => {
    const list = s.items[op.chat] ?? NO_ITEMS;
    if (op.op === "item") return { items: { ...s.items, [op.chat]: upsertItem(list, op.item) } };
    return { items: { ...s.items, [op.chat]: appendDelta(list, op.id, op.text) } };
  }),
  setHistory: (chatId, history) => set((s) => ({
    items: { ...s.items, [chatId]: mergeHistory(history, s.items[chatId] ?? NO_ITEMS) },
    loaded: { ...s.loaded, [chatId]: true },
  })),
  setOptions: (chatId, options) => set((s) => ({ options: { ...s.options, [chatId]: options } })),
}));
