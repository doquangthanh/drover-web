// Pure helpers for the suggestions in the message box: which `@file` or `/command` is being typed, and how a pick replaces it.
import type { ChatCommand } from "./chat-types";

export interface Token { kind: "file" | "command"; query: string; start: number; end: number }

/** The `@word` before the caret (anywhere, after a space or at the start) or a `/word` at the very start of the message. */
export function activeToken(text: string, caret: number): Token | null {
  const head = text.slice(0, caret);
  const file = /(^|\s)@([^\s@]*)$/.exec(head);
  if (file) return { kind: "file", query: file[2], start: head.length - file[2].length - 1, end: caret };
  const command = /^\s*\/([^\s/]*)$/.exec(head);
  if (command) return { kind: "command", query: command[1], start: head.indexOf("/"), end: caret };
  return null;
}

/** Replace the token with `insert` plus one space; returns the new text and where the caret goes. */
export function applySuggestion(text: string, token: Token, insert: string): { text: string; caret: number } {
  const before = text.slice(0, token.start) + insert + " ";
  return { text: before + text.slice(token.end).replace(/^ /, ""), caret: before.length };
}

/** Commands whose name starts with the query first, then names containing it, then descriptions; at most `limit`. */
export function filterCommands(commands: ChatCommand[], query: string, limit = 12): ChatCommand[] {
  const q = query.toLowerCase();
  if (!q) return commands.slice(0, limit);
  const rank = (c: ChatCommand): number => {
    const name = c.name.toLowerCase();
    if (name.startsWith(q)) return 0;
    if (name.includes(`:${q}`)) return 1; // "ck:fix" for "fix"
    if (name.includes(q)) return 2;
    return c.description.toLowerCase().includes(q) ? 3 : 4;
  };
  return commands.map((c) => [rank(c), c] as const).filter(([r]) => r < 4)
    .sort((a, b) => a[0] - b[0] || a[1].name.length - b[1].name.length).slice(0, limit).map(([, c]) => c);
}

/** Keep the highlighted row inside the list when the list shrinks or the user steps past an end. */
export const stepIndex = (index: number, delta: number, count: number): number => (count ? (index + delta + count) % count : 0);
