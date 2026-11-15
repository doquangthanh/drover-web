// Bumped on the daemon's "messages" event (a Claude Code sub-agent started or stopped). Sub-agents change no pane
// state, so the Agent tree uses this counter to refetch `messages.list`.
import { create } from "zustand";

export const useMessagesTick = create<{ n: number }>(() => ({ n: 0 }));

export const bumpMessagesTick = () => useMessagesTick.setState((s) => ({ n: s.n + 1 }));
